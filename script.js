document.addEventListener("DOMContentLoaded", () => {
  const rows = Array.from(document.querySelectorAll("tbody tr:not(.no-bookings-row)"));
  const noBookingsRow = document.querySelector("#no-bookings-row");
  const searchFilter = document.querySelector("#booking-search-filter");
  const monthFilter = document.querySelector("#booking-month-filter");
  const dateFilter = document.querySelector("#booking-date-filter");
  const timeFilter = document.querySelector("#booking-time-filter");
  const roomFilter = document.querySelector("#booking-room-filter");
  const statusFilter = document.querySelector("#booking-status-filter");
  const resetFilterButton = document.querySelector("#booking-reset-filter");
  const emptyResetButton = document.querySelector("#empty-reset-btn");
  const bookingCount = document.querySelector("#booking-count");
  const statTotalBookings = document.querySelector("#stat-total-bookings");

  const chips = Array.from(document.querySelectorAll(".quick-chips .chip"));
  const toggleDayBtn = document.querySelector("#toggle-day-btn");
  const toggleMonthBtn = document.querySelector("#toggle-month-btn");
  const dateInputLabel = document.querySelector("#date-input-label");

  let activePeriod = "all";
  let dateMode = "day";

  if (statTotalBookings) {
    statTotalBookings.textContent = rows.length;
  }

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

  const matchBookingTime = (rowTime, rowStart, selectedTime) => {
    if (!selectedTime) return true;
    const cleanSelected = selectedTime.trim().toLowerCase();
    const cleanRow = rowTime.trim().toLowerCase();

    if (cleanSelected === "morning") {
      return cleanRow.includes("am");
    }

    if (cleanSelected === "afternoon") {
      return cleanRow.includes("pm");
    }

    if (cleanRow === cleanSelected || cleanRow.includes(cleanSelected)) {
      return true;
    }

    if (/^\d{2}:\d{2}$/.test(selectedTime)) {
      const [h, m] = selectedTime.split(":").map(Number);
      const hour12 = h % 12 || 12;
      const period = h < 12 ? "am" : "pm";
      const formatted12 = `${hour12}:${String(m).padStart(2, "0")} ${period}`;
      const formattedShort = `${hour12}:${String(m).padStart(2, "0")}`;
      if (cleanRow.includes(formatted12) || cleanRow.includes(formattedShort)) {
        return true;
      }
      if (rowStart && rowStart === selectedTime) {
        return true;
      }
    }

    return false;
  };

  const applyFilters = () => {
    const selectedMonth = dateMode === "month" && monthFilter ? monthFilter.value.trim() : "";
    const selectedDate = dateMode === "day" && dateFilter ? dateFilter.value.trim() : "";
    const selectedTime = timeFilter ? timeFilter.value.trim() : "";
    const selectedRoom = roomFilter ? roomFilter.value.trim() : "";
    const selectedStatus = statusFilter ? statusFilter.value.trim().toLowerCase() : "";
    const searchQuery = searchFilter ? searchFilter.value.trim().toLowerCase() : "";

    const todayStr = getTodayStr();
    const week = getWeekRange();
    const currentMonthStr = getCurrentMonthStr();

    let visibleCount = 0;

    rows.forEach((row) => {
      const rowDate = row.dataset.bookingDate || "";
      const rowMonth = row.dataset.bookingMonth || rowDate.slice(0, 7);
      const rowTime = row.dataset.bookingTime || row.querySelector(".date-cell span")?.textContent?.trim() || "";
      const rowStart = row.dataset.bookingStart || "";
      const rowRoom = row.dataset.room || row.querySelector(".room-cell")?.firstChild?.textContent?.trim() || "";
      const rowStatus = row.dataset.status || row.querySelector(".status-pill")?.textContent?.trim().toLowerCase() || "";
      const rowEmployee = row.dataset.employee || row.querySelector(".person-cell span:not(.avatar)")?.textContent?.trim() || "";
      const rowTitle = row.dataset.title || row.children[1]?.textContent?.trim() || "";

      let matchPeriod = true;
      if (activePeriod === "today") {
        matchPeriod = rowDate === todayStr;
      } else if (activePeriod === "week") {
        matchPeriod = rowDate >= week.start && rowDate <= week.end;
      } else if (activePeriod === "month") {
        matchPeriod = rowDate.startsWith(currentMonthStr) || rowMonth === currentMonthStr;
      }

      const matchDate = !selectedDate || rowDate === selectedDate;
      const matchMonth = !selectedMonth || rowMonth === selectedMonth || rowDate.startsWith(selectedMonth);
      const matchTime = matchBookingTime(rowTime, rowStart, selectedTime);
      const matchRoom = !selectedRoom || rowRoom.toLowerCase() === selectedRoom.toLowerCase();
      const matchStatus = !selectedStatus || rowStatus === selectedStatus;
      const matchSearch =
        !searchQuery ||
        rowEmployee.toLowerCase().includes(searchQuery) ||
        rowTitle.toLowerCase().includes(searchQuery) ||
        rowRoom.toLowerCase().includes(searchQuery);

      const isVisible =
        matchPeriod &&
        matchDate &&
        matchMonth &&
        matchTime &&
        matchRoom &&
        matchStatus &&
        matchSearch;

      row.style.display = isVisible ? "table-row" : "none";
      if (isVisible) {
        visibleCount++;
      }
    });

    if (noBookingsRow) {
      noBookingsRow.style.display = visibleCount === 0 ? "table-row" : "none";
    }

    if (bookingCount) {
      bookingCount.textContent = `Showing ${visibleCount} of ${rows.length} bookings`;
    }

    const hasActiveFilters = Boolean(
      (searchFilter && searchFilter.value.trim()) ||
      (dateMode === "day" && dateFilter && dateFilter.value.trim()) ||
      (dateMode === "month" && monthFilter && monthFilter.value.trim()) ||
      (timeFilter && timeFilter.value.trim()) ||
      (roomFilter && roomFilter.value.trim()) ||
      (statusFilter && statusFilter.value.trim()) ||
      (activePeriod && activePeriod !== "all")
    );

    if (resetFilterButton) {
      resetFilterButton.disabled = !hasActiveFilters;
    }
  };

  // Quick Chips
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      activePeriod = chip.dataset.period || "all";

      if (dateFilter) dateFilter.value = "";
      if (monthFilter) monthFilter.value = "";

      applyFilters();
    });
  });

  // Date Mode Toggle (Day vs Month)
  if (toggleDayBtn && toggleMonthBtn) {
    toggleDayBtn.addEventListener("click", () => {
      dateMode = "day";
      toggleDayBtn.classList.add("active");
      toggleMonthBtn.classList.remove("active");
      if (dateFilter) dateFilter.style.display = "block";
      if (monthFilter) {
        monthFilter.style.display = "none";
        monthFilter.value = "";
      }
      if (dateInputLabel) dateInputLabel.textContent = "Date";
      applyFilters();
    });

    toggleMonthBtn.addEventListener("click", () => {
      dateMode = "month";
      toggleMonthBtn.classList.add("active");
      toggleDayBtn.classList.remove("active");
      if (monthFilter) monthFilter.style.display = "block";
      if (dateFilter) {
        dateFilter.style.display = "none";
        dateFilter.value = "";
      }
      if (dateInputLabel) dateInputLabel.textContent = "Month";
      applyFilters();
    });
  }

  // Inputs change handlers
  if (dateFilter) {
    dateFilter.addEventListener("change", () => {
      if (dateFilter.value) {
        chips.forEach((c) => c.classList.remove("active"));
        activePeriod = "custom";
      }
      applyFilters();
    });
  }

  if (monthFilter) {
    monthFilter.addEventListener("change", () => {
      if (monthFilter.value) {
        chips.forEach((c) => c.classList.remove("active"));
        activePeriod = "custom";
      }
      applyFilters();
    });
  }

  if (searchFilter) {
    searchFilter.addEventListener("input", applyFilters);
  }

  if (roomFilter) {
    roomFilter.addEventListener("change", applyFilters);
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", applyFilters);
  }

  if (timeFilter) {
    timeFilter.addEventListener("change", applyFilters);
  }

  const resetFilters = () => {
    if (searchFilter) searchFilter.value = "";
    if (roomFilter) roomFilter.value = "";
    if (statusFilter) statusFilter.value = "";
    if (dateFilter) dateFilter.value = "";
    if (monthFilter) monthFilter.value = "";
    if (timeFilter) timeFilter.value = "";

    activePeriod = "all";
    chips.forEach((c) => {
      c.classList.toggle("active", c.dataset.period === "all");
    });

    if (toggleDayBtn && toggleMonthBtn) {
      dateMode = "day";
      toggleDayBtn.classList.add("active");
      toggleMonthBtn.classList.remove("active");
      if (dateFilter) dateFilter.style.display = "block";
      if (monthFilter) monthFilter.style.display = "none";
      if (dateInputLabel) dateInputLabel.textContent = "Date";
    }

    applyFilters();
  };

  if (resetFilterButton) {
    resetFilterButton.addEventListener("click", resetFilters);
  }

  if (emptyResetButton) {
    emptyResetButton.addEventListener("click", resetFilters);
  }

  // Booking details modal
  const bookingModal = document.querySelector("#booking-modal");
  const detailsButtons = Array.from(document.querySelectorAll(".booking-details-button"));
  const closeModalButton = bookingModal ? bookingModal.querySelector(".modal-close") : null;
  const detailFields = {
    roomSetup: bookingModal ? bookingModal.querySelector("#detail-room-setup") : null,
    instructions: bookingModal ? bookingModal.querySelector("#detail-instructions") : null,
    foodCoffee: bookingModal ? bookingModal.querySelector("#detail-food-coffee") : null,
  };

  const fallbackDetails = {
    roomSetup: "Boardroom layout with 10 seats and a projector",
    instructions: "Please keep the room cool and have the screen connected before the meeting starts.",
    foodCoffee: "2 coffees, 1 tea, and light snacks for 5 attendees",
  };

  detailsButtons.forEach((detailsButton) => {
    detailsButton.addEventListener("click", () => {
      const booking = detailsButton.closest("tr");
      if (detailFields.roomSetup) {
        detailFields.roomSetup.textContent = booking.dataset.roomSetup || fallbackDetails.roomSetup;
      }
      if (detailFields.instructions) {
        detailFields.instructions.textContent = booking.dataset.additionalInstructions || fallbackDetails.instructions;
      }
      if (detailFields.foodCoffee) {
        detailFields.foodCoffee.textContent = booking.dataset.foodCoffee || fallbackDetails.foodCoffee;
      }
      if (bookingModal) {
        bookingModal.showModal();
      }
    });
  });

  if (closeModalButton) {
    closeModalButton.addEventListener("click", () => bookingModal.close());
  }

  if (bookingModal) {
    bookingModal.addEventListener("click", (event) => {
      if (event.target === bookingModal) {
        bookingModal.close();
      }
    });
  }

  // Run initial filter check to set button state and counts
  applyFilters();
});
