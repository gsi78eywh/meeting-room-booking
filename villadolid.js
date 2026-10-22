document.addEventListener("DOMContentLoaded", () => {
  const TOTAL_ROOMS = 8;

  const tbody = document.querySelector("#bookings-tbody");
  const noBookingsRow = document.querySelector("#no-bookings-row");
  const dateFilter = document.querySelector("#booking-date-filter");
  const timeFilter = document.querySelector("#booking-time-filter");
  const resetFilterButton = document.querySelector("#booking-reset-filter");
  const emptyResetButton = document.querySelector("#empty-reset-btn");
  const bookingCount = document.querySelector("#booking-count");

  // Three container stat elements
  const statTotalBookings = document.querySelector("#stat-total-bookings");
  const statOccupiedRooms = document.querySelector("#stat-occupied-rooms");
  const statAvailableRooms = document.querySelector("#stat-available-rooms");
  const statFootBookings = document.querySelector("#stat-foot-bookings");
  const statFootOccupied = document.querySelector("#stat-foot-occupied");
  const statFootAvailable = document.querySelector("#stat-foot-available");

  // Modal elements
  const bookingModal = document.querySelector("#booking-modal");
  const closeModalButton = bookingModal ? bookingModal.querySelector(".modal-close") : null;
  const detailFields = {
    roomSetup: bookingModal ? bookingModal.querySelector("#detail-room-setup") : null,
    instructions: bookingModal ? bookingModal.querySelector("#detail-instructions") : null,
    foodCoffee: bookingModal ? bookingModal.querySelector("#detail-food-coffee") : null,
  };

  const fallbackDetails = {
    roomSetup: "Boardroom layout with 10 seats and a projector",
    instructions: "Please keep the room cool and have the screen connected before the meeting starts.",
    foodCoffee: "2 coffees, 1 tea, and light snacks for attendees",
  };

  const escHtml = (str) => {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // Helper date formatting (e.g., "2026-10-05" -> "October 5, 2026")
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

  // Attach modal detail listener to a button
  const attachModalListener = (button) => {
    button.addEventListener("click", () => {
      const booking = button.closest("tr");
      if (!booking) return;

      if (detailFields.roomSetup) {
        detailFields.roomSetup.textContent = booking.dataset.roomSetup || fallbackDetails.roomSetup;
      }
      if (detailFields.instructions) {
        detailFields.instructions.textContent = booking.dataset.additionalInstructions || fallbackDetails.instructions;
      }
      if (detailFields.foodCoffee) {
        detailFields.foodCoffee.textContent = booking.dataset.foodCoffee || fallbackDetails.foodCoffee;
      }
      if (bookingModal && typeof bookingModal.showModal === "function") {
        bookingModal.showModal();
      }
    });
  };

  // Load newly booked reservations from storage
  const loadStoredBookings = () => {
    let stored = [];
    try {
      const fromLocal = JSON.parse(localStorage.getItem("rafiBookings") || "[]");
      const fromSession = JSON.parse(sessionStorage.getItem("rafiBookings") || "[]");
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
      // Check if already in DOM
      const existing = tbody.querySelector(`tr[data-booking-id="${bookingId}"]`);
      if (existing) return;

      const newTr = document.createElement("tr");
      newTr.dataset.bookingId = bookingId;
      newTr.dataset.bookingDate = b.date || "";
      newTr.dataset.bookingMonth = (b.date || "").slice(0, 7);
      newTr.dataset.bookingTime = b.meetingTime || "";
      newTr.dataset.room = b.room || "";
      newTr.dataset.status = (b.status || "booked").toLowerCase();
      newTr.dataset.employee = b.employee || "User submission";
      newTr.dataset.title = b.meetingTitle || b.title || "Meeting";
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

  // Time parsing helpers for robust slot comparison
  const parseTimeToMinutes = (tStr) => {
    if (!tStr) return null;
    const match = tStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridiem = match[3] ? match[3].toUpperCase() : null;

    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const parseTimeRange = (rangeStr) => {
    if (!rangeStr) return null;
    const parts = rangeStr.split(/[-–—]|to/i).map((s) => s.trim());
    if (parts.length >= 2) {
      const startMin = parseTimeToMinutes(parts[0]);
      const endMin = parseTimeToMinutes(parts[1]);
      if (startMin !== null && endMin !== null) {
        return { start: startMin, end: endMin };
      }
    }
    const singleMin = parseTimeToMinutes(rangeStr);
    if (singleMin !== null) {
      return { start: singleMin, end: singleMin + 60 };
    }
    return null;
  };

  const matchBookingTime = (rowTimeStr, selectedTime) => {
    if (!selectedTime) return true;
    const cleanSelected = selectedTime.trim().toLowerCase();
    const cleanRow = (rowTimeStr || "").trim().toLowerCase();

    if (!cleanRow) return false;

    const rowRange = parseTimeRange(cleanRow);

    if (cleanSelected === "morning") {
      // Morning: starts before 12:00 PM (720 min)
      if (rowRange) {
        return rowRange.start < 720;
      }
      return cleanRow.includes("am");
    }

    if (cleanSelected === "afternoon") {
      // Afternoon: reaches into or starts after 12:00 PM
      if (rowRange) {
        return rowRange.end > 720 && rowRange.start >= 660;
      }
      return cleanRow.includes("pm");
    }

    // Direct string match or substring match
    if (cleanRow === cleanSelected || cleanRow.includes(cleanSelected) || cleanSelected.includes(cleanRow)) {
      return true;
    }

    // Interval overlap comparison
    const filterRange = parseTimeRange(cleanSelected);
    if (rowRange && filterRange) {
      return rowRange.start < filterRange.end && rowRange.end > filterRange.start;
    }

    return false;
  };

  const matchBookingDate = (rowDate, selectedDate) => {
    if (!selectedDate) return true;
    if (!rowDate) return false;
    const cleanRowDate = rowDate.trim().slice(0, 10);
    const cleanSelectedDate = selectedDate.trim().slice(0, 10);
    return cleanRowDate === cleanSelectedDate;
  };

  // Main filter application & container update function
  const applyFilters = () => {
    // 1. Ensure latest stored bookings are present
    loadStoredBookings();

    const selectedDate = dateFilter ? dateFilter.value.trim() : "";
    const selectedTime = timeFilter ? timeFilter.value.trim() : "";
    const hasFilter = Boolean(selectedDate || selectedTime);

    const rows = Array.from(document.querySelectorAll("#bookings-tbody tr:not(.no-bookings-row)"));

    let visibleCount = 0;
    const matchingOccupiedRooms = new Set();
    const allOccupiedRooms = new Set();

    rows.forEach((row) => {
      const rowDate = row.dataset.bookingDate || "";
      const rowTime = row.dataset.bookingTime || row.querySelector(".date-cell span")?.textContent?.trim() || "";
      const rowRoom = row.dataset.room || row.querySelector(".room-cell")?.firstChild?.textContent?.trim() || "";
      const rowStatus = (row.dataset.status || row.querySelector(".status-pill")?.textContent || "").trim().toLowerCase();

      const isActive = rowStatus !== "cancelled";

      if (isActive && rowRoom) {
        allOccupiedRooms.add(rowRoom);
      }

      const matchDate = matchBookingDate(rowDate, selectedDate);
      const matchTime = matchBookingTime(rowTime, selectedTime);

      const isVisible = matchDate && matchTime;

      row.style.display = isVisible ? "" : "none";

      if (isVisible) {
        visibleCount++;
        if (isActive && rowRoom) {
          matchingOccupiedRooms.add(rowRoom);
        }
      }
    });

    // Empty state row
    if (noBookingsRow) {
      noBookingsRow.style.display = visibleCount === 0 ? "table-row" : "none";
    }

    // Subtitle counter
    if (bookingCount) {
      bookingCount.textContent = `Showing ${visibleCount} of ${rows.length} bookings`;
    }

    // Clear filter button state
    if (resetFilterButton) {
      resetFilterButton.disabled = !hasFilter;
    }

    // 2. DYNAMICALLY UPDATE THE THREE STAT CONTAINERS
    if (hasFilter) {
      // Container 1: Total bookings
      if (statTotalBookings) {
        statTotalBookings.textContent = visibleCount;
      }
      if (statFootBookings) {
        if (visibleCount === 0) {
          statFootBookings.textContent = "No matches";
        } else if (visibleCount === 1) {
          statFootBookings.textContent = "For selected filter";
        } else {
          statFootBookings.textContent = `${visibleCount} reservations`;
        }
      }

      // Container 2: Rooms occupied
      const occupiedCount = matchingOccupiedRooms.size;
      if (statOccupiedRooms) {
        statOccupiedRooms.textContent = occupiedCount;
      }
      if (statFootOccupied) {
        statFootOccupied.textContent = `${occupiedCount} of ${TOTAL_ROOMS} rooms`;
      }

      // Container 3: Available rooms
      const availableCount = Math.max(0, TOTAL_ROOMS - occupiedCount);
      if (statAvailableRooms) {
        statAvailableRooms.textContent = availableCount;
      }
      if (statFootAvailable) {
        statFootAvailable.textContent =
          availableCount === TOTAL_ROOMS ? "All 8 rooms free" : `${availableCount} rooms available`;
      }
    } else {
      // Default view when no filter is applied
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

      const availableCount = Math.max(0, TOTAL_ROOMS - occupiedCount);
      if (statAvailableRooms) {
        statAvailableRooms.textContent = availableCount;
      }
      if (statFootAvailable) {
        statFootAvailable.textContent = "Right now";
      }
    }
  };

  // Event handlers: Date filter loads newly booked and recalculates containers
  if (dateFilter) {
    const handleDateInteraction = () => {
      loadStoredBookings();
      applyFilters();
    };

    dateFilter.addEventListener("click", handleDateInteraction);
    dateFilter.addEventListener("focus", handleDateInteraction);
    dateFilter.addEventListener("change", handleDateInteraction);
    dateFilter.addEventListener("input", handleDateInteraction);
  }

  // Event handlers: Time filter
  if (timeFilter) {
    const handleTimeInteraction = () => {
      loadStoredBookings();
      applyFilters();
    };

    timeFilter.addEventListener("change", handleTimeInteraction);
    timeFilter.addEventListener("input", handleTimeInteraction);
  }

  // Clear filters
  const resetFilters = () => {
    if (dateFilter) dateFilter.value = "";
    if (timeFilter) timeFilter.value = "";
    applyFilters();
  };

  if (resetFilterButton) {
    resetFilterButton.addEventListener("click", resetFilters);
  }

  if (emptyResetButton) {
    emptyResetButton.addEventListener("click", resetFilters);
  }

  // Initialize modal buttons on static rows
  const initialButtons = Array.from(document.querySelectorAll(".booking-details-button"));
  initialButtons.forEach((btn) => attachModalListener(btn));

  if (closeModalButton) {
    closeModalButton.addEventListener("click", () => {
      if (bookingModal) bookingModal.close();
    });
  }

  if (bookingModal) {
    bookingModal.addEventListener("click", (event) => {
      if (event.target === bookingModal) {
        bookingModal.close();
      }
    });
  }

  // Cross-tab and window sync: reload newly booked reservations
  window.addEventListener("storage", (event) => {
    if (event.key === "rafiBookings") {
      loadStoredBookings();
      applyFilters();
    }
  });

  window.addEventListener("focus", () => {
    loadStoredBookings();
    applyFilters();
  });

  // Initial load on page ready
  loadStoredBookings();
  applyFilters();
});
