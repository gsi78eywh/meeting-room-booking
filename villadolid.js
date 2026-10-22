document.addEventListener("DOMContentLoaded", () => {
  // Storage keys
  const STORAGE_KEY_BOOKINGS = "rafiBookings";
  const STORAGE_KEY_MODS = "rafiRowModifications";
  const STORAGE_KEY_ROOMS = "rafiRooms";

  // Default rooms
  const DEFAULT_ROOMS = [
    {
      id: "room-1",
      name: "Collaboration Hub",
      floor: "2nd Floor",
      capacity: 14,
      amenities: ["Aircon", "TV/Projector", "Whiteboard"],
      status: "Active"
    },
    {
      id: "room-2",
      name: "Meeting Room A",
      floor: "3rd Floor",
      capacity: 8,
      amenities: ["Aircon", "Whiteboard"],
      status: "Active"
    },
    {
      id: "room-3",
      name: "Boardroom",
      floor: "4th Floor",
      capacity: 10,
      amenities: ["Aircon", "TV/Projector", "Whiteboard"],
      status: "Active"
    },
    {
      id: "room-4",
      name: "Focus Room",
      floor: "3rd Floor",
      capacity: 4,
      amenities: ["Aircon"],
      status: "Active"
    },
    {
      id: "room-5",
      name: "3rd Floor Meeting Room",
      floor: "3rd Floor",
      capacity: 8,
      amenities: ["Aircon", "Whiteboard"],
      status: "Active"
    },
    {
      id: "room-6",
      name: "5th Floor REA Training Room",
      floor: "5th Floor",
      capacity: 35,
      amenities: ["Aircon", "TV/Projector"],
      status: "Active"
    },
    {
      id: "room-7",
      name: "6th Floor Meeting Room",
      floor: "6th Floor",
      capacity: 14,
      amenities: ["Aircon", "TV/Projector", "Whiteboard"],
      status: "Active"
    },
    {
      id: "room-8",
      name: "Roof Deck Meeting Room",
      floor: "Roof Deck",
      capacity: 8,
      amenities: ["Aircon", "Whiteboard"],
      status: "Active"
    }
  ];

  // Navigation tab elements
  const tabReservations = document.querySelector("#tab-reservations");
  const tabRooms = document.querySelector("#tab-rooms");
  const viewReservations = document.querySelector("#view-reservations");
  const viewRooms = document.querySelector("#view-rooms");
  const tabRoomsCount = document.querySelector("#tab-rooms-count");

  // Reservations elements
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
  const btnConfirmCancellation = document.querySelector("#btn-confirm-cancellation");

  // 4. Room Management elements
  const roomsGridContainer = document.querySelector("#rooms-grid-container");
  const btnOpenAddRoom = document.querySelector("#btn-open-add-room");
  const roomSearchFilter = document.querySelector("#room-search-filter");
  const roomFloorFilter = document.querySelector("#room-floor-filter");
  const roomStatusFilter = document.querySelector("#room-status-filter");
  const roomResetFilter = document.querySelector("#room-reset-filter");

  // Room Modal elements
  const roomManageModal = document.querySelector("#room-manage-modal");
  const roomModalTitle = document.querySelector("#room-modal-title");
  const roomModalSubtitle = document.querySelector("#room-modal-subtitle");
  const roomFormId = document.querySelector("#room-form-id");
  const roomFormName = document.querySelector("#room-form-name");
  const roomFormFloor = document.querySelector("#room-form-floor");
  const roomFormCapacity = document.querySelector("#room-form-capacity");
  const roomFormStatus = document.querySelector("#room-form-status");
  const roomFormAmenities = document.querySelector("#room-form-amenities");
  const roomModalToast = document.querySelector("#room-modal-toast");
  const btnSaveRoom = document.querySelector("#btn-save-room");

  const closeModalButtons = Array.from(document.querySelectorAll(".modal-close"));

  let currentActiveRow = null;
  let activePeriod = "all"; // "all" | "day" | "week" | "month" | "custom"

  /* =========================================
     ROOM MANAGEMENT DATA HELPERS
  ========================================= */

  const getStoredRooms = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ROOMS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}
    try {
      localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(DEFAULT_ROOMS));
    } catch (e) {}
    return DEFAULT_ROOMS;
  };

  const saveRooms = (roomsList) => {
    try {
      localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(roomsList));
      sessionStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(roomsList));
    } catch (e) {}
  };

  const escHtml = (str) => {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const showToastMsg = (toastEl, message, isError = false) => {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.className = `modal-toast ${isError ? "error" : ""}`;
    toastEl.style.display = "block";
    setTimeout(() => {
      toastEl.style.display = "none";
    }, 2800);
  };

  /* =========================================
     NAVIGATION: 1-CLICK TAB SWITCHING
  ========================================= */

  const switchTab = (tabName) => {
    if (tabName === "rooms") {
      if (tabRooms) {
        tabRooms.classList.add("active");
        tabRooms.setAttribute("aria-selected", "true");
      }
      if (tabReservations) {
        tabReservations.classList.remove("active");
        tabReservations.setAttribute("aria-selected", "false");
      }
      if (viewRooms) viewRooms.style.display = "block";
      if (viewReservations) viewReservations.style.display = "none";
      renderRoomsGrid();
    } else {
      if (tabReservations) {
        tabReservations.classList.add("active");
        tabReservations.setAttribute("aria-selected", "true");
      }
      if (tabRooms) {
        tabRooms.classList.remove("active");
        tabRooms.setAttribute("aria-selected", "false");
      }
      if (viewReservations) viewReservations.style.display = "block";
      if (viewRooms) viewRooms.style.display = "none";
      loadStoredBookings();
      applyFilters();
    }
  };

  if (tabReservations) {
    tabReservations.addEventListener("click", () => switchTab("reservations"));
  }
  if (tabRooms) {
    tabRooms.addEventListener("click", () => switchTab("rooms"));
  }

  /* =========================================
     ROOM MANAGEMENT: RENDER & ACTIONS
  ========================================= */

  const renderRoomsGrid = () => {
    if (!roomsGridContainer) return;
    const rooms = getStoredRooms();

    // Update count badges & dynamic total rooms
    if (tabRoomsCount) {
      tabRoomsCount.textContent = String(rooms.length);
    }

    const searchQuery = (roomSearchFilter?.value || "").trim().toLowerCase();
    const floorFilter = (roomFloorFilter?.value || "").trim().toLowerCase();
    const statusFilter = (roomStatusFilter?.value || "").trim().toLowerCase();

    const filteredRooms = rooms.filter((r) => {
      const matchSearch =
        !searchQuery ||
        r.name.toLowerCase().includes(searchQuery) ||
        r.floor.toLowerCase().includes(searchQuery) ||
        (Array.isArray(r.amenities) && r.amenities.some((a) => a.toLowerCase().includes(searchQuery)));

      const matchFloor = !floorFilter || r.floor.toLowerCase() === floorFilter;
      const matchStatus = !statusFilter || (r.status || "active").toLowerCase() === statusFilter;

      return matchSearch && matchFloor && matchStatus;
    });

    if (roomResetFilter) {
      roomResetFilter.disabled = !(searchQuery || floorFilter || statusFilter);
    }

    if (filteredRooms.length === 0) {
      roomsGridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: var(--panel-bg); border-radius: 14px; border: 1px solid var(--line);">
          <p style="font-size: 16px; font-weight: 700; color: var(--heading-deep); margin: 0 0 6px;">No meeting rooms found</p>
          <p style="font-size: 14px; color: var(--muted); margin: 0 0 16px;">Try adjusting your search query or clear the filter.</p>
          <button type="button" class="empty-clear-link" id="btn-rooms-empty-clear">Clear room filters</button>
        </div>
      `;
      const btnClearEmpty = roomsGridContainer.querySelector("#btn-rooms-empty-clear");
      if (btnClearEmpty) {
        btnClearEmpty.addEventListener("click", () => {
          if (roomSearchFilter) roomSearchFilter.value = "";
          if (roomFloorFilter) roomFloorFilter.value = "";
          if (roomStatusFilter) roomStatusFilter.value = "";
          renderRoomsGrid();
        });
      }
      return;
    }

    roomsGridContainer.innerHTML = "";

    filteredRooms.forEach((room) => {
      const isMaint = (room.status || "Active").toLowerCase() === "maintenance";
      const statusClass = isMaint ? "status-maintenance" : "status-active";
      const statusLabel = isMaint ? "Under Maintenance" : "Active";
      const toggleLabel = isMaint ? "Set Active" : "Set Maintenance";

      const amenitiesHtml = (room.amenities || [])
        .map((a) => `<span class="room-amenity-pill">${escHtml(a)}</span>`)
        .join("");

      const card = document.createElement("article");
      card.className = "room-card";
      card.dataset.roomId = room.id;

      card.innerHTML = `
        <div>
          <div class="room-card-top">
            <h3 class="room-card-name">${escHtml(room.name)}</h3>
            <span class="status-pill ${statusClass}">${statusLabel}</span>
          </div>

          <div class="room-card-details">
            <div class="room-card-meta">
              <span>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                ${escHtml(room.floor)}
              </span>
              <span>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                ${escHtml(room.capacity)} pax
              </span>
            </div>

            <div class="room-amenities-wrap">
              ${amenitiesHtml || '<span style="font-size: 12px; color: var(--muted);">Standard equipment</span>'}
            </div>
          </div>
        </div>

        <div class="room-card-actions">
          <div class="room-card-left-actions">
            <button type="button" class="btn-room-edit" aria-label="Edit ${escHtml(room.name)}">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span>Edit</span>
            </button>
            <button type="button" class="btn-room-toggle" aria-label="${toggleLabel} for ${escHtml(room.name)}">
              ${toggleLabel}
            </button>
          </div>

          <button type="button" class="btn-room-delete" title="Delete room" aria-label="Delete ${escHtml(room.name)}">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      `;

      // 1-Click Edit Room
      const editBtn = card.querySelector(".btn-room-edit");
      if (editBtn) {
        editBtn.addEventListener("click", () => openEditRoomModal(room));
      }

      // 1-Click Toggle Status
      const toggleBtn = card.querySelector(".btn-room-toggle");
      if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
          const allRooms = getStoredRooms();
          const target = allRooms.find((r) => r.id === room.id);
          if (target) {
            target.status = (target.status || "Active").toLowerCase() === "active" ? "Maintenance" : "Active";
            saveRooms(allRooms);
            renderRoomsGrid();
            applyFilters();
          }
        });
      }

      // 1-Click Delete Room
      const deleteBtn = card.querySelector(".btn-room-delete");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
          const confirmed = window.confirm(`Are you sure you want to remove ${room.name}?`);
          if (!confirmed) return;
          const allRooms = getStoredRooms();
          const updated = allRooms.filter((r) => r.id !== room.id);
          saveRooms(updated);
          renderRoomsGrid();
          applyFilters();
        });
      }

      roomsGridContainer.appendChild(card);
    });
  };

  // Open Room Modal: Add Mode
  const openAddRoomModal = () => {
    if (roomFormId) roomFormId.value = "";
    if (roomFormName) roomFormName.value = "";
    if (roomFormFloor) roomFormFloor.value = "";
    if (roomFormCapacity) roomFormCapacity.value = "8";
    if (roomFormStatus) roomFormStatus.value = "Active";
    if (roomFormAmenities) roomFormAmenities.value = "Aircon, TV/Projector, Whiteboard";
    if (roomModalTitle) roomModalTitle.textContent = "Add New Room";
    if (roomModalSubtitle) roomModalSubtitle.textContent = "Enter details for the new meeting room.";
    if (btnSaveRoom) btnSaveRoom.textContent = "Add room";
    if (roomModalToast) roomModalToast.style.display = "none";

    if (roomManageModal && typeof roomManageModal.showModal === "function") {
      roomManageModal.showModal();
    }
  };

  // Open Room Modal: Edit Mode
  const openEditRoomModal = (room) => {
    if (roomFormId) roomFormId.value = room.id;
    if (roomFormName) roomFormName.value = room.name || "";
    if (roomFormFloor) roomFormFloor.value = room.floor || "";
    if (roomFormCapacity) roomFormCapacity.value = room.capacity || "8";
    if (roomFormStatus) roomFormStatus.value = room.status || "Active";
    if (roomFormAmenities) roomFormAmenities.value = Array.isArray(room.amenities) ? room.amenities.join(", ") : "";
    if (roomModalTitle) roomModalTitle.textContent = `Edit Room`;
    if (roomModalSubtitle) roomModalSubtitle.textContent = `Update settings for ${room.name}.`;
    if (btnSaveRoom) btnSaveRoom.textContent = "Save changes";
    if (roomModalToast) roomModalToast.style.display = "none";

    if (roomManageModal && typeof roomManageModal.showModal === "function") {
      roomManageModal.showModal();
    }
  };

  if (btnOpenAddRoom) {
    btnOpenAddRoom.addEventListener("click", openAddRoomModal);
  }

  // Save Room (Add or Edit)
  if (btnSaveRoom) {
    btnSaveRoom.addEventListener("click", () => {
      const name = roomFormName ? roomFormName.value.trim() : "";
      const floor = roomFormFloor ? roomFormFloor.value.trim() : "";
      const capacity = roomFormCapacity ? parseInt(roomFormCapacity.value, 10) || 1 : 1;
      const status = roomFormStatus ? roomFormStatus.value : "Active";
      const rawAmenities = roomFormAmenities ? roomFormAmenities.value.trim() : "";

      if (!name) {
        showToastMsg(roomModalToast, "Please enter a room name.", true);
        return;
      }
      if (!floor) {
        showToastMsg(roomModalToast, "Please enter the floor location.", true);
        return;
      }

      const amenities = rawAmenities
        ? rawAmenities.split(",").map((a) => a.trim()).filter(Boolean)
        : ["Aircon"];

      const allRooms = getStoredRooms();
      const existingId = roomFormId ? roomFormId.value : "";

      if (existingId) {
        // Edit existing room
        const idx = allRooms.findIndex((r) => r.id === existingId);
        if (idx !== -1) {
          allRooms[idx] = {
            ...allRooms[idx],
            name,
            floor,
            capacity,
            status,
            amenities
          };
        }
      } else {
        // Add new room
        const newRoom = {
          id: `room-${Date.now()}`,
          name,
          floor,
          capacity,
          status,
          amenities
        };
        allRooms.push(newRoom);
      }

      saveRooms(allRooms);
      renderRoomsGrid();
      applyFilters();

      showToastMsg(roomModalToast, existingId ? "Room updated successfully!" : "Room added successfully!");
      setTimeout(() => {
        if (roomManageModal) roomManageModal.close();
      }, 600);
    });
  }

  // Room filters listeners
  if (roomSearchFilter) {
    roomSearchFilter.addEventListener("input", renderRoomsGrid);
  }
  if (roomFloorFilter) {
    roomFloorFilter.addEventListener("change", renderRoomsGrid);
  }
  if (roomStatusFilter) {
    roomStatusFilter.addEventListener("change", renderRoomsGrid);
  }
  if (roomResetFilter) {
    roomResetFilter.addEventListener("click", () => {
      if (roomSearchFilter) roomSearchFilter.value = "";
      if (roomFloorFilter) roomFloorFilter.value = "";
      if (roomStatusFilter) roomStatusFilter.value = "";
      renderRoomsGrid();
    });
  }

  /* =========================================
     DATE & TIME HELPERS
  ========================================= */

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

  /* =========================================
     RESERVATIONS STORAGE & MODS
  ========================================= */

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
          if (isCancelled) cancelBtn.title = "Reservation is already cancelled";
        }
      }
    });
  };

  /* =========================================
     RESERVATIONS: 3 MODALS (VIEW, MODIFY, CANCEL)
  ========================================= */

  // 1. VIEW MODAL
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

  // 2. MODIFY MODAL
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

  // 3. CANCEL MODAL
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

    if (cancelConfirmModal && typeof cancelConfirmModal.showModal === "function") {
      cancelConfirmModal.showModal();
    }
  };

  // Wire up 3 icon buttons on a row
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

  // Update storage for bookings
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
        showToastMsg(modifyModalToast, "Please enter a meeting title.", true);
        return;
      }

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

      showToastMsg(modifyModalToast, "Changes saved successfully!");
      setTimeout(() => {
        if (modifyDetailsModal) modifyDetailsModal.close();
      }, 600);
    });
  }

  // Confirm cancellation
  if (btnConfirmCancellation) {
    btnConfirmCancellation.addEventListener("click", () => {
      if (!currentActiveRow) return;

      currentActiveRow.dataset.status = "cancelled";
      const pill = currentActiveRow.querySelector(".status-pill");
      if (pill) {
        pill.className = "status-pill status-cancelled";
        pill.textContent = "Cancelled";
      }

      const rowCancelBtn = currentActiveRow.querySelector(".btn-cancel");
      if (rowCancelBtn) {
        rowCancelBtn.disabled = true;
        rowCancelBtn.title = "Reservation is already cancelled";
      }

      const bookingId = currentActiveRow.dataset.bookingId || "";
      updateBookingInStorage(bookingId, { status: "Cancelled" });

      if (cancelConfirmModal) cancelConfirmModal.close();

      applyFilters();
    });
  }

  /* =========================================
     LOAD STORED BOOKINGS (WITH 3 ICON BUTTONS)
  ========================================= */

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
            if (storedStatus === "cancelled") cancelBtn.title = "Reservation is already cancelled";
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

  /* =========================================
     RESERVATIONS: FILTER & STATS CALCULATION
  ========================================= */

  const applyFilters = () => {
    loadStoredBookings();

    const rooms = getStoredRooms();
    const currentTotalRooms = rooms.length || TOTAL_ROOMS;

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
        statFootOccupied.textContent = `${occupiedCount} of ${currentTotalRooms} rooms`;
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
        statFootOccupied.textContent = `of ${currentTotalRooms} rooms`;
      }
    }
  };

  /* =========================================
     FILTER LISTENERS
  ========================================= */

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

  /* =========================================
     MODAL CLOSE HANDLERS
  ========================================= */

  closeModalButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (viewDetailsModal) viewDetailsModal.close();
      if (modifyDetailsModal) modifyDetailsModal.close();
      if (cancelConfirmModal) cancelConfirmModal.close();
      if (roomManageModal) roomManageModal.close();
    });
  });

  [viewDetailsModal, modifyDetailsModal, cancelConfirmModal, roomManageModal].forEach((modal) => {
    if (modal) {
      modal.addEventListener("click", (event) => {
        if (event.target === modal) {
          modal.close();
        }
      });
    }
  });

  // Attach action listeners to initial static rows
  const staticRows = Array.from(document.querySelectorAll("#bookings-tbody tr:not(.no-bookings-row)"));
  staticRows.forEach((row) => attachRowActionListeners(row));

  // Sync across tabs & windows
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY_BOOKINGS || event.key === STORAGE_KEY_MODS || event.key === STORAGE_KEY_ROOMS) {
      loadStoredBookings();
      applySavedModificationsToStaticRows();
      applyFilters();
      renderRoomsGrid();
    }
  });

  window.addEventListener("focus", () => {
    loadStoredBookings();
    applySavedModificationsToStaticRows();
    applyFilters();
    renderRoomsGrid();
  });

  // Initial load
  applySavedModificationsToStaticRows();
  loadStoredBookings();
  applyFilters();
  renderRoomsGrid();
});
