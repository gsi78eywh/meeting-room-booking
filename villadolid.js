document.addEventListener("DOMContentLoaded", () => {
  const TOTAL_ROOMS = 8;

  const tbody = document.querySelector("#bookings-tbody");
  const noBookingsRow = document.querySelector("#no-bookings-row");
  const dateFilter = document.querySelector("#booking-date-filter");
  const periodChips = Array.from(document.querySelectorAll(".period-chip"));
  const resetFilterButton = document.querySelector("#booking-reset-filter");
  const emptyResetButton = document.querySelector("#empty-reset-btn");
  const bookingCount = document.querySelector("#booking-count");

  // Stat elements
  const statTotalBookings = document.querySelector("#stat-total-bookings");
  const statOccupiedRooms = document.querySelector("#stat-occupied-rooms");
  const statFootBookings = document.querySelector("#stat-foot-bookings");
  const statFootOccupied = document.querySelector("#stat-foot-occupied");

  // 1. View Details Modal elements
  const viewDetailsModal = document.querySelector("#view-details-modal");
  const viewStatusPill = document.querySelector("#view-status-pill");
  const viewEmployee = document.querySelector("#view-employee");
  const viewTitle = document.querySelector("#view-title");
  const viewRoom = document.querySelector("#view-room");
  const viewDatetime = document.querySelector("#view-datetime");
  const viewPax = document.querySelector("#view-pax");
  const viewSetup = document.querySelector("#view-setup");
  const viewFood = document.querySelector("#view-food");
  const viewInstructions = document.querySelector("#view-instructions");

  // 2. Modify Modal elements
  const modifyDetailsModal = document.querySelector("#modify-details-modal");
  const modifyEmployee = document.querySelector("#modify-employee");
  const modifyRoom = document.querySelector("#modify-room");
  const modifyDatetime = document.querySelector("#modify-datetime");
  const modifyStatusPill = document.querySelector("#modify-status-pill");
  const modifyInputTitle = document.querySelector("#modify-input-title");
  const modifyInputPax = document.querySelector("#modify-input-pax");
  const modifyInputSetup = document.querySelector("#modify-input-setup");
  const modifyInputFood = document.querySelector("#modify-input-food");
  const modifyInputInstructions = document.querySelector("#modify-input-instructions");
  const modifyModalToast = document.querySelector("#modify-modal-toast");
  const btnSaveModification = document.querySelector("#btn-save-modification");

  // 3. Cancel Confirmation Modal elements
  const cancelConfirmModal = document.querySelector("#cancel-confirm-modal");
  const cancelModalSummary = document.querySelector("#cancel-modal-summary");
  const cancelModalToast = document.querySelector("#cancel-modal-toast");
  const btnConfirmCancellation = document.querySelector("#btn-confirm-cancellation");

  const closeModalButtons = Array.from(document.querySelectorAll(".modal-close"));

  let currentActiveRow = null;
  let activePeriod = "all"; // "all" | "day" | "week" | "month" | "custom"

  // Storage keys
  const STORAGE_KEY_BOOKINGS = "rafiBookings";
  const STORAGE_KEY_MODS = "rafiRowModifications";

  const escHtml = (str) => {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const showModifyToast = (message, isError = false) => {
    if (!modifyModalToast) return;
    modifyModalToast.textContent = message;
    modifyModalToast.className = `modal-toast ${isError ? "error" : ""}`;
    modifyModalToast.style.display = "block";
    setTimeout(() => {
      modifyModalToast.style.display = "none";
    }, 2800);
  };

  const getTodayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const getWeekRange = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const fmt = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    return { start: fmt(monday), end: fmt(sunday) };
  };

  const getCurrentMonthStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  };

  const formatDateDisplay = (isoDate) => {
    if (!isoDate) return "—";
    try {
      const parts = String(isoDate).split("T")[0].split("-");
      if (parts.length === 3) {
        const year = parts[0];
        const monthNames = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];
        const month = monthNames[parseInt(parts[1], 10) - 1] || parts[1];
        const day = parseInt(parts[2], 10);
        return `${month} ${day}, ${year}`;
      }
    } catch (e) {}
    return isoDate;
  };

  // Get stored modifications
  const getStoredModifications = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_MODS) || "{}");
    } catch (e) {
      return {};
    }
  };

  const saveStoredModification = (bookingId, patch) => {
    if (!bookingId) return;
    const mods = getStoredModifications();
    mods[bookingId] = { ...(mods[bookingId] || {}), ...patch };
    try {
      localStorage.setItem(STORAGE_KEY_MODS, JSON.stringify(mods));
    } catch (e) {}
  };

  // Apply stored modifications to static rows
  const applySavedModificationsToStaticRows = () => {
    const mods = getStoredModifications();
    Object.keys(mods).forEach((id) => {
      const row = tbody ? tbody.querySelector(`tr[data-booking-id="${id}"]`) : null;
      if (!row) return;
      const mod = mods[id];
      if (mod.title) {
        row.dataset.title = mod.title;
        if (row.children[1]) row.children[1].textContent = mod.title;
      }
      if (mod.pax) {
        row.dataset.pax = mod.pax;
        if (row.children[4]) row.children[4].textContent = mod.pax;
      }
      if (mod.roomSetup) row.dataset.roomSetup = mod.roomSetup;
      if (mod.additionalInstructions) row.dataset.additionalInstructions = mod.additionalInstructions;
      if (mod.foodCoffee) row.dataset.foodCoffee = mod.foodCoffee;
      if (mod.status) {
        const isCancelled = mod.status.toLowerCase() === "cancelled";
        row.dataset.status = isCancelled ? "cancelled" : "booked";
        const pill = row.querySelector(".status-pill");
        if (pill) {
          pill.className = `status-pill ${isCancelled ? "status-cancelled" : "status-booked"}`;
          pill.textContent = isCancelled ? "Cancelled" : "Booked";
        }
        const cancelBtn = row.querySelector(".btn-cancel");
        if (cancelBtn) {
          cancelBtn.disabled = isCancelled;
        }
      }
    });
  };

  // 1. OPEN VIEW DETAILS MODAL (View only)
  const openViewDetailsModal = (row) => {
    currentActiveRow = row;
    if (!currentActiveRow) return;

    const employee = row.dataset.employee || row.querySelector(".person-cell span:not(.avatar)")?.textContent?.trim() || "User submission";
    const title = row.dataset.title || row.children[1]?.textContent?.trim() || "—";
    const room = row.dataset.room || "Room";
    const floor = row.querySelector(".room-cell span")?.textContent?.trim() || "";
    const date = row.dataset.bookingDate || "";
    const time = row.dataset.bookingTime || row.querySelector(".date-cell span")?.textContent?.trim() || "";
    const pax = row.dataset.pax || row.children[4]?.textContent?.trim() || "1";
    const status = (row.dataset.status || row.querySelector(".status-pill")?.textContent || "booked").trim().toLowerCase();
    const isCancelled = status === "cancelled";
    const roomSetup = row.dataset.roomSetup || "Not Applicable";
    const food = row.dataset.foodCoffee || "None provided";
    const instructions = row.dataset.additionalInstructions || "None provided";

    if (viewStatusPill) {
      viewStatusPill.className = `status-pill ${isCancelled ? "status-cancelled" : "status-booked"}`;
      viewStatusPill.textContent = isCancelled ? "Cancelled" : "Booked";
    }
    if (viewEmployee) viewEmployee.textContent = employee;
    if (viewTitle) viewTitle.textContent = title;
    if (viewRoom) viewRoom.textContent = floor ? `${room} (${floor})` : room;
    if (viewDatetime) viewDatetime.textContent = `${formatDateDisplay(date)} • ${time}`;
    if (viewPax) viewPax.textContent = pax;
    if (viewSetup) viewSetup.textContent = roomSetup;
    if (viewFood) viewFood.textContent = food;
    if (viewInstructions) viewInstructions.textContent = instructions;

    if (viewDetailsModal && typeof viewDetailsModal.showModal === "function") {
      viewDetailsModal.showModal();
    }
  };

  // 2. OPEN MODIFY MODAL (Modify details)
  const openModifyDetailsModal = (row) => {
    currentActiveRow = row;
    if (!currentActiveRow) return;

    const employee = row.dataset.employee || row.querySelector(".person-cell span:not(.avatar)")?.textContent?.trim() || "User submission";
    const title = row.dataset.title || row.children[1]?.textContent?.trim() || "";
    const room = row.dataset.room || "Room";
    const floor = row.querySelector(".room-cell span")?.textContent?.trim() || "";
    const date = row.dataset.bookingDate || "";
    const time = row.dataset.bookingTime || row.querySelector(".date-cell span")?.textContent?.trim() || "";
    const pax = row.dataset.pax || row.children[4]?.textContent?.trim() || "1";
    const status = (row.dataset.status || row.querySelector(".status-pill")?.textContent || "booked").trim().toLowerCase();
    const isCancelled = status === "cancelled";
    const roomSetup = row.dataset.roomSetup || "Not Applicable";
    const food = row.dataset.foodCoffee || "";
    const instructions = row.dataset.additionalInstructions || "";

    if (modifyEmployee) modifyEmployee.textContent = employee;
    if (modifyRoom) modifyRoom.textContent = floor ? `${room} (${floor})` : room;
    if (modifyDatetime) modifyDatetime.textContent = `${formatDateDisplay(date)} • ${time}`;
    if (modifyStatusPill) {
      modifyStatusPill.className = `status-pill ${isCancelled ? "status-cancelled" : "status-booked"}`;
      modifyStatusPill.textContent = isCancelled ? "Cancelled" : "Booked";
    }

    if (modifyInputTitle) modifyInputTitle.value = title;
    if (modifyInputPax) modifyInputPax.value = pax;
    if (modifyInputSetup) {
      modifyInputSetup.value = roomSetup;
      if (!modifyInputSetup.value) modifyInputSetup.value = "Not Applicable";
    }
    if (modifyInputFood) modifyInputFood.value = food;
    if (modifyInputInstructions) modifyInputInstructions.value = instructions;
    if (modifyModalToast) modifyModalToast.style.display = "none";

    if (modifyDetailsModal && typeof modifyDetailsModal.showModal === "function") {
      modifyDetailsModal.showModal();
    }
  };

  // 3. OPEN CANCEL CONFIRMATION MODAL (Pop up confirmation)
  const openCancelConfirmModal = (row) => {
    currentActiveRow = row;
    if (!currentActiveRow) return;

    const isCancelled = (row.dataset.status || "").toLowerCase() === "cancelled";
    if (isCancelled) return;

    const title = row.dataset.title || row.children[1]?.textContent?.trim() || "Meeting";
    const room = row.dataset.room || "Room";
    const date = row.dataset.bookingDate || "";

    if (cancelModalSummary) {
      cancelModalSummary.innerHTML = `You are cancelling the reservation for <strong>${escHtml(title)}</strong> in <strong>${escHtml(room)}</strong>${date ? ` on <strong>${formatDateDisplay(date)}</strong>` : ""}.`;
    }

    if (cancelModalToast) cancelModalToast.style.display = "none";

    if (cancelConfirmModal && typeof cancelConfirmModal.showModal === "function") {
      cancelConfirmModal.showModal();
    }
  };

  // Wire up action buttons on a table row
  const attachRowActionListeners = (row) => {
    const btnView = row.querySelector(".btn-view");
    const btnModify = row.querySelector(".btn-modify");
    const btnCancel = row.querySelector(".btn-cancel");

    if (btnView) {
      btnView.addEventListener("click", () => openViewDetailsModal(row));
    }
    if (btnModify) {
      btnModify.addEventListener("click", () => openModifyDetailsModal(row));
    }
    if (btnCancel) {
      btnCancel.addEventListener("click", () => openCancelConfirmModal(row));
    }
  };

  // Update storage for dynamic or static bookings
  const updateBookingInStorage = (bookingId, patch) => {
    let updatedInRafi = false;
    try {
      const fromLocal = JSON.parse(localStorage.getItem(STORAGE_KEY_BOOKINGS) || "[]");
      const fromSession = JSON.parse(sessionStorage.getItem(STORAGE_KEY_BOOKINGS) || "[]");

      const updateList = (list) => {
        return list.map((b) => {
          const id = String(b.id || `${b.date}_${b.room}_${b.meetingTime}`);
          if (id === bookingId) {
            updatedInRafi = true;
            return { ...b, ...patch };
          }
          return b;
        });
      };

      const newLocal = updateList(fromLocal);
      const newSession = updateList(fromSession);

      if (updatedInRafi) {
        localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(newLocal));
        sessionStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(newSession));
      }
    } catch (e) {}

    saveStoredModification(bookingId, patch);
  };

  // Save changes from modify modal
  if (btnSaveModification) {
    btnSaveModification.addEventListener("click", () => {
      if (!currentActiveRow) return;

      const newTitle = modifyInputTitle ? modifyInputTitle.value.trim() : "";
      const newPax = modifyInputPax ? parseInt(modifyInputPax.value, 10) || 1 : 1;
      const newSetup = modifyInputSetup ? modifyInputSetup.value : "Not Applicable";
      const newFood = modifyInputFood ? modifyInputFood.value.trim() : "";
      const newInstructions = modifyInputInstructions ? modifyInputInstructions.value.trim() : "";

      if (!newTitle) {
        showModifyToast("Please enter a meeting title.", true);
        return;
      }

      // Update DOM row
      currentActiveRow.dataset.title = newTitle;
      currentActiveRow.dataset.pax = String(newPax);
      currentActiveRow.dataset.roomSetup = newSetup;
      currentActiveRow.dataset.foodCoffee = newFood;
      currentActiveRow.dataset.additionalInstructions = newInstructions;

      if (currentActiveRow.children[1]) {
        currentActiveRow.children[1].textContent = newTitle;
      }
      if (currentActiveRow.children[4]) {
        currentActiveRow.children[4].textContent = String(newPax);
      }

      // Update storage
      const bookingId = currentActiveRow.dataset.bookingId || "";
      updateBookingInStorage(bookingId, {
        meetingTitle: newTitle,
        title: newTitle,
        participants: String(newPax),
        roomSetup: newSetup,
        foodPreparation: newFood,
        foodCoffee: newFood,
        additionalInstructions: newInstructions,
      });

      showModifyToast("Changes saved successfully!");
      setTimeout(() => {
        if (modifyDetailsModal) modifyDetailsModal.close();
      }, 600);
    });
  }

  // Confirm cancellation from cancel modal
  if (btnConfirmCancellation) {
    btnConfirmCancellation.addEventListener("click", () => {
      if (!currentActiveRow) return;

      // Update row status
      currentActiveRow.dataset.status = "cancelled";
      const pill = currentActiveRow.querySelector(".status-pill");
      if (pill) {
        pill.className = "status-pill status-cancelled";
        pill.textContent = "Cancelled";
      }

      // Disable cancel button on row
      const rowCancelBtn = currentActiveRow.querySelector(".btn-cancel");
      if (rowCancelBtn) {
        rowCancelBtn.disabled = true;
      }

      // Update storage
      const bookingId = currentActiveRow.dataset.bookingId || "";
      updateBookingInStorage(bookingId, { status: "Cancelled" });

      // Close modal
      if (cancelConfirmModal) cancelConfirmModal.close();

      // Recalculate stats & filter
      applyFilters();
    });
  }

  // Load newly booked reservations from storage
  const loadStoredBookings = () => {
    let stored = [];
    try {
      const fromLocal = JSON.parse(localStorage.getItem(STORAGE_KEY_BOOKINGS) || "[]");
      const fromSession = JSON.parse(sessionStorage.getItem(STORAGE_KEY_BOOKINGS) || "[]");
      const mergedMap = new Map();
      [...fromLocal, ...fromSession].forEach((b) => {
        if (!b) return;
        const key = b.id || `${b.date}_${b.room}_${b.meetingTime}`;
        mergedMap.set(key, b);
      });
      stored = Array.from(mergedMap.values());
    } catch (e) {
      console.warn("Could not parse rafiBookings from storage", e);
    }

    if (!stored.length || !tbody) return;

    stored.forEach((b) => {
      const bookingId = String(b.id || `${b.date}_${b.room}_${b.meetingTime}`);
      const existing = tbody.querySelector(`tr[data-booking-id="${bookingId}"]`);
      if (existing) {
        const currentStatus = (existing.dataset.status || "").toLowerCase();
        const storedStatus = (b.status || "booked").toLowerCase();
        if (currentStatus !== storedStatus) {
          existing.dataset.status = storedStatus;
          const pill = existing.querySelector(".status-pill");
          if (pill) {
            pill.className = `status-pill ${storedStatus === "cancelled" ? "status-cancelled" : "status-booked"}`;
            pill.textContent = storedStatus === "cancelled" ? "Cancelled" : "Booked";
          }
          const cancelBtn = existing.querySelector(".btn-cancel");
          if (cancelBtn) {
            cancelBtn.disabled = storedStatus === "cancelled";
          }
        }
        return;
      }

      const isCancelled = (b.status || "booked").toLowerCase() === "cancelled";
      const newTr = document.createElement("tr");
      newTr.dataset.bookingId = bookingId;
      newTr.dataset.bookingDate = b.date || "";
      newTr.dataset.bookingMonth = (b.date || "").slice(0, 7);
      newTr.dataset.bookingTime = b.meetingTime || "";
      newTr.dataset.room = b.room || "";
      newTr.dataset.status = isCancelled ? "cancelled" : "booked";
      newTr.dataset.employee = b.employee || "User submission";
      newTr.dataset.title = b.meetingTitle || b.title || "Meeting";
      newTr.dataset.pax = b.participants || "1";
      newTr.dataset.roomSetup = b.roomSetup || "Not Applicable";
      newTr.dataset.additionalInstructions = b.additionalInstructions || "None provided";
      newTr.dataset.foodCoffee = b.foodPreparation || "None provided";
      newTr.classList.add("stored-booking-row");

      const employeeName = b.employee || "User submission";
      const initials = employeeName
        .split(" ")
        .filter(Boolean)
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "US";

      const statusText = isCancelled ? "Cancelled" : (b.status || "Booked");
      const statusClass = isCancelled ? "status-cancelled" : "status-booked";

      newTr.innerHTML = `
        <td class="person-cell">
          <span class="avatar avatar-user">${initials}</span>
          <span>${escHtml(employeeName)}</span>
        </td>
        <td>${escHtml(b.meetingTitle || b.title || "Meeting")}</td>
        <td class="room-cell">${escHtml(b.room || "Room")}<br /><span>${escHtml(b.floor || "")}</span></td>
        <td class="date-cell">${formatDateDisplay(b.date)}<br /><span>${escHtml(b.meetingTime || "")}</span></td>
        <td>${escHtml(b.participants || "1")}</td>
        <td><span class="status-pill ${statusClass}">${escHtml(statusText)}</span></td>
        <td class="action-cell">
          <div class="action-buttons-group">
            <button class="btn-action btn-view" type="button" title="View details" aria-label="View details">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button class="btn-action btn-modify" type="button" title="Modify reservation" aria-label="Modify reservation">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-action btn-cancel" type="button" title="${isCancelled ? "Reservation is already cancelled" : "Cancel reservation"}" aria-label="Cancel reservation" ${isCancelled ? "disabled" : ""}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </td>
      `;

      attachRowActionListeners(newTr);

      if (noBookingsRow) {
        tbody.insertBefore(newTr, noBookingsRow);
      } else {
        tbody.appendChild(newTr);
      }
    });
  };

  // Filter application & stats calculation
  const applyFilters = () => {
    loadStoredBookings();

    const selectedDate = dateFilter ? dateFilter.value.trim() : "";
    const hasFilter = Boolean(selectedDate || (activePeriod && activePeriod !== "all"));

    const rows = Array.from(document.querySelectorAll("#bookings-tbody tr:not(.no-bookings-row)"));

    const todayStr = getTodayStr();
    const week = getWeekRange();
    const currentMonthStr = getCurrentMonthStr();

    let visibleCount = 0;
    const matchingOccupiedRooms = new Set();
    const allOccupiedRooms = new Set();

    rows.forEach((row) => {
      const rowDate = (row.dataset.bookingDate || "").trim().slice(0, 10);
      const rowMonth = row.dataset.bookingMonth || rowDate.slice(0, 7);
      const rowRoom = row.dataset.room || row.querySelector(".room-cell")?.firstChild?.textContent?.trim() || "";
      const rowStatus = (row.dataset.status || row.querySelector(".status-pill")?.textContent || "").trim().toLowerCase();

      const isActive = rowStatus !== "cancelled";

      if (isActive && rowRoom) {
        allOccupiedRooms.add(rowRoom);
      }

      let matchPeriod = true;
      if (selectedDate) {
        matchPeriod = rowDate === selectedDate;
      } else if (activePeriod === "day") {
        matchPeriod = rowDate === todayStr;
      } else if (activePeriod === "week") {
        matchPeriod = rowDate >= week.start && rowDate <= week.end;
      } else if (activePeriod === "month") {
        matchPeriod = rowDate.startsWith(currentMonthStr) || rowMonth === currentMonthStr;
      }

      const isVisible = matchPeriod;
      row.style.display = isVisible ? "" : "none";

      if (isVisible) {
        visibleCount++;
        if (isActive && rowRoom) {
          matchingOccupiedRooms.add(rowRoom);
        }
      }
    });

    if (noBookingsRow) {
      noBookingsRow.style.display = visibleCount === 0 ? "table-row" : "none";
    }

    if (bookingCount) {
      bookingCount.textContent = `Showing ${visibleCount} of ${rows.length} bookings`;
    }

    if (resetFilterButton) {
      resetFilterButton.disabled = !hasFilter;
    }

    // Update 2 Stat Cards
    if (hasFilter) {
      if (statTotalBookings) {
        statTotalBookings.textContent = visibleCount;
      }
      if (statFootBookings) {
        if (visibleCount === 0) {
          statFootBookings.textContent = "No matches";
        } else if (visibleCount === 1) {
          statFootBookings.textContent = "1 reservation";
        } else {
          statFootBookings.textContent = `${visibleCount} reservations`;
        }
      }

      const occupiedCount = matchingOccupiedRooms.size;
      if (statOccupiedRooms) {
        statOccupiedRooms.textContent = occupiedCount;
      }
      if (statFootOccupied) {
        statFootOccupied.textContent = `${occupiedCount} of ${TOTAL_ROOMS} rooms`;
      }
    } else {
      if (statTotalBookings) {
        statTotalBookings.textContent = rows.length;
      }
      if (statFootBookings) {
        statFootBookings.textContent = "All scheduled";
      }

      const occupiedCount = allOccupiedRooms.size;
      if (statOccupiedRooms) {
        statOccupiedRooms.textContent = occupiedCount;
      }
      if (statFootOccupied) {
        statFootOccupied.textContent = "of 8 rooms";
      }
    }
  };

  // Period chip handlers (All, Day, Week, Month)
  periodChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      periodChips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      activePeriod = chip.dataset.period || "all";

      if (dateFilter) {
        dateFilter.value = "";
      }

      loadStoredBookings();
      applyFilters();
    });
  });

  // Date filter handler
  if (dateFilter) {
    const handleDateInput = () => {
      if (dateFilter.value) {
        periodChips.forEach((c) => c.classList.remove("active"));
        activePeriod = "custom";
      } else {
        const allChip = periodChips.find((c) => c.dataset.period === "all");
        if (allChip) allChip.classList.add("active");
        activePeriod = "all";
      }
      loadStoredBookings();
      applyFilters();
    };

    dateFilter.addEventListener("change", handleDateInput);
    dateFilter.addEventListener("input", handleDateInput);
    dateFilter.addEventListener("focus", () => loadStoredBookings());
    dateFilter.addEventListener("click", () => loadStoredBookings());
  }

  // Clear filters
  const resetFilters = () => {
    if (dateFilter) dateFilter.value = "";
    activePeriod = "all";
    periodChips.forEach((c) => {
      c.classList.toggle("active", c.dataset.period === "all");
    });
    loadStoredBookings();
    applyFilters();
  };

  if (resetFilterButton) {
    resetFilterButton.addEventListener("click", resetFilters);
  }

  if (emptyResetButton) {
    emptyResetButton.addEventListener("click", resetFilters);
  }

  // Close modals
  closeModalButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (viewDetailsModal) viewDetailsModal.close();
      if (modifyDetailsModal) modifyDetailsModal.close();
      if (cancelConfirmModal) cancelConfirmModal.close();
    });
  });

  [viewDetailsModal, modifyDetailsModal, cancelConfirmModal].forEach((modal) => {
    if (modal) {
      modal.addEventListener("click", (event) => {
        if (event.target === modal) {
          modal.close();
        }
      });
    }
  });

  // Attach action listeners to static rows
  const staticRows = Array.from(document.querySelectorAll("#bookings-tbody tr:not(.no-bookings-row)"));
  staticRows.forEach((row) => attachRowActionListeners(row));

  // Sync across tabs & windows
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY_BOOKINGS || event.key === STORAGE_KEY_MODS) {
      loadStoredBookings();
      applySavedModificationsToStaticRows();
      applyFilters();
    }
  });

  window.addEventListener("focus", () => {
    loadStoredBookings();
    applySavedModificationsToStaticRows();
    applyFilters();
  });

  // Initial load
  applySavedModificationsToStaticRows();
  loadStoredBookings();
  applyFilters();
});
