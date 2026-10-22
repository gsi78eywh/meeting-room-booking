document.addEventListener("DOMContentLoaded", () => {
  const TOTAL_ROOMS = 8;

  const tbody = document.querySelector("#bookings-tbody");
  const noBookingsRow = document.querySelector("#no-bookings-row");
  const dateFilter = document.querySelector("#booking-date-filter");
  const periodChips = Array.from(document.querySelectorAll(".period-chip"));
  const resetFilterButton = document.querySelector("#booking-reset-filter");
  const emptyResetButton = document.querySelector("#empty-reset-btn");
  const bookingCount = document.querySelector("#booking-count");

  // Stat elements (Total bookings & Rooms occupied)
  const statTotalBookings = document.querySelector("#stat-total-bookings");
  const statOccupiedRooms = document.querySelector("#stat-occupied-rooms");
  const statFootBookings = document.querySelector("#stat-foot-bookings");
  const statFootOccupied = document.querySelector("#stat-foot-occupied");

  // Modal elements
  const bookingModal = document.querySelector("#booking-modal");
  const closeModalButtons = Array.from(document.querySelectorAll(".modal-close"));
  const modalEmployee = document.querySelector("#modal-employee");
  const modalRoom = document.querySelector("#modal-room");
  const modalDatetime = document.querySelector("#modal-datetime");
  const modalStatusPill = document.querySelector("#modal-status-pill");

  const editModalTitle = document.querySelector("#edit-modal-title");
  const editModalPax = document.querySelector("#edit-modal-pax");
  const editModalSetup = document.querySelector("#edit-modal-setup");
  const editModalFood = document.querySelector("#edit-modal-food");
  const editModalInstructions = document.querySelector("#edit-modal-instructions");
  const modalToast = document.querySelector("#modal-toast");
  const btnModalCancel = document.querySelector("#btn-modal-cancel");
  const btnModalSave = document.querySelector("#btn-modal-save");

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

  const showToast = (message, isError = false) => {
    if (!modalToast) return;
    modalToast.textContent = message;
    modalToast.className = `modal-toast ${isError ? "error" : ""}`;
    modalToast.style.display = "block";
    setTimeout(() => {
      modalToast.style.display = "none";
    }, 3200);
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

  // Persisted hardcoded row modifications (edits/cancellations)
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

  // Apply saved modifications to static rows on initial load
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
        row.dataset.status = mod.status.toLowerCase();
        const pill = row.querySelector(".status-pill");
        if (pill) {
          if (mod.status.toLowerCase() === "cancelled") {
            pill.className = "status-pill status-cancelled";
            pill.textContent = "Cancelled";
          } else {
            pill.className = "status-pill status-booked";
            pill.textContent = "Booked";
          }
        }
      }
    });
  };

  // Modal open & population
  const openBookingModal = (row) => {
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
    const roomSetup = row.dataset.roomSetup || "Not Applicable";
    const instructions = row.dataset.additionalInstructions || "";
    const food = row.dataset.foodCoffee || "";

    // Fill overview card
    if (modalEmployee) modalEmployee.textContent = employee;
    if (modalRoom) modalRoom.textContent = floor ? `${room} (${floor})` : room;
    if (modalDatetime) modalDatetime.textContent = `${formatDateDisplay(date)} • ${time}`;

    const isCancelled = status === "cancelled";
    if (modalStatusPill) {
      modalStatusPill.className = `status-pill ${isCancelled ? "status-cancelled" : "status-booked"}`;
      modalStatusPill.textContent = isCancelled ? "Cancelled" : "Booked";
    }

    // Fill editable fields
    if (editModalTitle) editModalTitle.value = title;
    if (editModalPax) editModalPax.value = pax;
    if (editModalSetup) {
      editModalSetup.value = roomSetup;
      if (!editModalSetup.value) {
        editModalSetup.value = "Not Applicable";
      }
    }
    if (editModalFood) editModalFood.value = food;
    if (editModalInstructions) editModalInstructions.value = instructions;

    // Cancel button state
    if (btnModalCancel) {
      if (isCancelled) {
        btnModalCancel.disabled = true;
        btnModalCancel.textContent = "Booking cancelled";
      } else {
        btnModalCancel.disabled = false;
        btnModalCancel.textContent = "Cancel booking";
      }
    }

    if (modalToast) modalToast.style.display = "none";

    if (bookingModal && typeof bookingModal.showModal === "function") {
      bookingModal.showModal();
    }
  };

  const attachModalListener = (button) => {
    button.addEventListener("click", () => {
      const row = button.closest("tr");
      if (row) openBookingModal(row);
    });
  };

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
        // If status changed in storage, sync it
        const currentStatus = (existing.dataset.status || "").toLowerCase();
        const storedStatus = (b.status || "booked").toLowerCase();
        if (currentStatus !== storedStatus) {
          existing.dataset.status = storedStatus;
          const pill = existing.querySelector(".status-pill");
          if (pill) {
            pill.className = `status-pill ${storedStatus === "cancelled" ? "status-cancelled" : "status-booked"}`;
            pill.textContent = storedStatus === "cancelled" ? "Cancelled" : "Booked";
          }
        }
        return;
      }

      const newTr = document.createElement("tr");
      newTr.dataset.bookingId = bookingId;
      newTr.dataset.bookingDate = b.date || "";
      newTr.dataset.bookingMonth = (b.date || "").slice(0, 7);
      newTr.dataset.bookingTime = b.meetingTime || "";
      newTr.dataset.room = b.room || "";
      newTr.dataset.status = (b.status || "booked").toLowerCase();
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

      const statusText = b.status || "Booked";
      const statusClass = statusText.toLowerCase() === "cancelled" ? "status-cancelled" : "status-booked";

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
        <td>
          <button class="booking-details-button" type="button" aria-haspopup="dialog" aria-controls="booking-modal">View details</button>
        </td>
      `;

      const detailBtn = newTr.querySelector(".booking-details-button");
      if (detailBtn) {
        attachModalListener(detailBtn);
      }

      if (noBookingsRow) {
        tbody.insertBefore(newTr, noBookingsRow);
      } else {
        tbody.appendChild(newTr);
      }
    });
  };

  // Update storage for dynamic or static bookings
  const updateBookingInStorage = (bookingId, patch) => {
    // 1. Update in rafiBookings (for bookings created via booking form)
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

    // 2. Also save to modifications map so all rows (including static demo rows) persist
    saveStoredModification(bookingId, patch);
  };

  // Main filter application & stats update
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

    // Update the Two Stat Containers
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
    dateFilter.addEventListener("focus", () => {
      loadStoredBookings();
    });
    dateFilter.addEventListener("click", () => {
      loadStoredBookings();
    });
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

  // Save changes from modal
  if (btnModalSave) {
    btnModalSave.addEventListener("click", () => {
      if (!currentActiveRow) return;

      const newTitle = editModalTitle ? editModalTitle.value.trim() : "";
      const newPax = editModalPax ? parseInt(editModalPax.value, 10) || 1 : 1;
      const newSetup = editModalSetup ? editModalSetup.value : "Not Applicable";
      const newFood = editModalFood ? editModalFood.value.trim() : "";
      const newInstructions = editModalInstructions ? editModalInstructions.value.trim() : "";

      if (!newTitle) {
        showToast("Please enter a meeting title.", true);
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

      showToast("Changes saved successfully!");
      setTimeout(() => {
        if (bookingModal) bookingModal.close();
      }, 700);
    });
  }

  // Cancel booking from modal
  if (btnModalCancel) {
    btnModalCancel.addEventListener("click", () => {
      if (!currentActiveRow) return;

      const isAlreadyCancelled = (currentActiveRow.dataset.status || "").toLowerCase() === "cancelled";
      if (isAlreadyCancelled) return;

      const confirmed = window.confirm("Are you sure you want to cancel this booking?");
      if (!confirmed) return;

      // Update row
      currentActiveRow.dataset.status = "cancelled";
      const pill = currentActiveRow.querySelector(".status-pill");
      if (pill) {
        pill.className = "status-pill status-cancelled";
        pill.textContent = "Cancelled";
      }

      // Update modal view
      if (modalStatusPill) {
        modalStatusPill.className = "status-pill status-cancelled";
        modalStatusPill.textContent = "Cancelled";
      }
      btnModalCancel.disabled = true;
      btnModalCancel.textContent = "Booking cancelled";

      // Persist cancellation
      const bookingId = currentActiveRow.dataset.bookingId || "";
      updateBookingInStorage(bookingId, { status: "Cancelled" });

      showToast("Booking has been cancelled.");

      // Refresh filter & occupied stats count
      applyFilters();
    });
  }

  // Close modal handlers
  closeModalButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (bookingModal) bookingModal.close();
    });
  });

  if (bookingModal) {
    bookingModal.addEventListener("click", (event) => {
      if (event.target === bookingModal) {
        bookingModal.close();
      }
    });
  }

  // Initial bindings for static rows
  const initialButtons = Array.from(document.querySelectorAll(".booking-details-button"));
  initialButtons.forEach((btn) => attachModalListener(btn));

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

  // Run initial setup
  applySavedModificationsToStaticRows();
  loadStoredBookings();
  applyFilters();
});
