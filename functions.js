/* =========================================
   ROOM DATA
========================================= */

const rooms = [
  {
    id: 1,
    name: "2nd Floor Conference Room (14 pax)",
    capacity: 14,
    floor: "2nd Floor",
    amenities: ["Aircon", "TV/Projector", "Whiteboard"]
  },

  {
    id: 2,
    name: "2nd Floor Huddle Room A(4 pax)",
    capacity: 4,
    floor: "2nd Floor",
    amenities: ["Aircon"]
  },

  {
    id: 3,
    name: "2nd Floor Huddle Room B(4 pax)",
    capacity: 4,
    floor: "2nd Floor",
    amenities: ["Aircon"]
  },

  {
    id: 4,
    name: "2nd Floor Huddle Room C(4 pax)",
    capacity: 4,
    floor: "2nd Floor",
    amenities: ["Aircon", "Whiteboard"]
  },

  {
    id: 5,
    name: "3rd Floor Meeting Room(8 pax)",
    capacity: 8,
    floor: "3rd Floor",
    amenities: ["Aircon", "Whiteboard"]
  },

  {
    id: 6,
    name: "4th Floor Meeting Room(14 pax)",
    capacity: 14,
    floor: "4th Floor",
    amenities: ["Aircon", "TV/Projector", "Whiteboard"]
  },
  {
    id: 7,
    name: "5th Floor REA Training Room(35 pax)",
    capacity: 35,
    floor: "5th Floor",
    amenities: ["Aircon", "TV/Projector"]
  },
  {
    id: 8,
    name: "5th Floor JRA Boardroom(10 pax)",
    capacity: 10,
    floor: "5th Floor",
    amenities: ["Aircon", "TV/Projector", "Whiteboard"]
  },
  {
    id: 9,
    name: "6th Floor Meeting Room(14 pax)",
    capacity: 14,
    floor: "6th Floor",
    amenities: ["Aircon", "TV/Projector", "Whiteboard"]
  },
  {
    id: 10,
    name: "Roof Deck Meeting Room(8 pax)",
    capacity: 8,
    floor: "Roof Deck",
    amenities: ["Aircon", "Whiteboard"]
  },
  {
    id: 11,
    name: "Canteen Ground Floor Meeting Room(12 pax)",
    capacity: 12,
    floor: "Ground Floor",
    amenities: ["Aircon", "TV/Projector", "Whiteboard"]
  },
  {
    id: 12,
    name: "Canteen 2nd Floor Meeting Room(12 pax)",
    capacity: 12,
    floor: "2nd Floor",
    amenities: ["Aircon", "TV/Projector", "Whiteboard"]
  },
  {
    id: 13,
    name: "RAFI Extension Office - Huddle Room(8 pax)",
    capacity: 8,
    floor: "RAFI Extension Office",
    amenities: ["Aircon"]
  },
  {
    id: 14,
    name: "RAFI Extension Office - Whole Area(25 pax)",
    capacity: 25,
    floor: "RAFI Extension Office",
    amenities: ["Aircon"]
  }
];

const times = [
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM"
];

const timeSlots = times.slice(0, -1).map((startTime, index) => ({
  start: index,
  end: index + 1,
  label: `${startTime} - ${times[index + 1]}`
}));

const legacyTimes = [
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "1:00 PM", "1:30 PM", "2:00 PM",
  "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM"
];

const state = {
  date: "",
  meetingTitle: "",
  roomSetup: "",
  additionalInstructions: "",
  foodPreparation: "",
  participants: null,
  room: null,
  start: null,
  end: null,
  meetingTime: "",
  startTime: "",
  endTime: "",
  historyDate: ""
};

let bookings = JSON.parse(
  (typeof localStorage !== "undefined" && localStorage.getItem("rafiBookings")) ||
  (typeof sessionStorage !== "undefined" && sessionStorage.getItem("rafiBookings")) ||
  "[]"
).map(booking => {
  if (booking.timeIndexVersion === 2 || !Number.isInteger(booking.start) || !Number.isInteger(booking.end)) {
    return booking;
  }

  const startTime = legacyTimes[booking.start];
  const endTime = legacyTimes[booking.end];
  if (!startTime || !endTime) return booking;

  return {
    ...booking,
    start: times.indexOf(startTime),
    end: times.indexOf(endTime),
    timeIndexVersion: 2
  };
});

function save() {
  try {
    sessionStorage.setItem("rafiBookings", JSON.stringify(bookings));
  } catch (e) {}
  try {
    localStorage.setItem("rafiBookings", JSON.stringify(bookings));
  } catch (e) {}
}


/* =========================================
   FORMAT DATE
========================================= */

function fmtDate(value) {

  if (!value) {
    return "Not selected";
  }

  return new Date(value + "T00:00:00")
    .toLocaleDateString(
      "en-US",
      {
        month: "long",
        day: "numeric",
        year: "numeric"
      }
    );

}


/* =========================================
   ESCAPE HTML
========================================= */

function esc(value) {

  return String(value ?? "")
    .replace(
      /[&<>"']/g,
      function (match) {

        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        }[match];

      }
    );

}


/* =========================================
   INITIAL APP
========================================= */

function render() {
  bindEvents();
  showPage("book");
}

function bindEvents() {
  document.getElementById("navBook").addEventListener("click", () => showPage("book"));
  document.getElementById("navHistory").addEventListener("click", () => showPage("history"));
  document.getElementById("bookButton").addEventListener("click", bookNow);
  document.getElementById("newBookingButton").addEventListener("click", newBooking);

  document.getElementById("date").addEventListener("change", event => {
    state.date = event.target.value;
    resetAfterDate();
    renderBooking();
  });

  document.getElementById("meetingTitle").addEventListener("input", event => {
    state.meetingTitle = event.target.value;
    updateSummary();
  });

  document.getElementById("participants").addEventListener("change", event => {
    selectParticipants(event.target.value);
  });

  document.getElementById("startTime").addEventListener("change", event => {
    state.startTime = event.target.value;
    state.start = times.indexOf(event.target.value);
    state.endTime = "";
    state.end = null;
    state.meetingTime = "";
    renderTimeOptions();
    updateSummary();
  });

  document.getElementById("endTime").addEventListener("change", event => {
    state.endTime = event.target.value;
    state.end = times.indexOf(event.target.value);
    state.meetingTime = selectedTimeRange() ? `${state.startTime} - ${state.endTime}` : "";
    renderBooking();
  });

  ["roomSetup", "additionalInstructions", "foodPreparation"].forEach(field => {
    document.getElementById(field).addEventListener(
      field === "roomSetup" ? "change" : "input",
      event => {
        state[field] = event.target.value;
        updateSummary();
      }
    );
  });

  document.getElementById("historyDate").addEventListener("change", event => {
    state.historyDate = event.target.value;
    renderHistory();
  });
}


/* =========================================
   PAGE NAVIGATION
========================================= */

function showPage(page) {

  document
    .getElementById("navBook")
    .classList
    .toggle(
      "active",
      page === "book"
    );


  document
    .getElementById("navHistory")
    .classList
    .toggle(
      "active",
      page === "history"
    );


  const bookingPage = page === "book";
  document.getElementById("bookingPage").hidden = !bookingPage;
  document.getElementById("historyPage").hidden = bookingPage;

  if (bookingPage) {

    document.getElementById(
      "pageHeading"
    ).textContent =
      "Meeting Room Booking";


    document.getElementById(
      "pageSub"
    ).textContent =
      "Find and reserve a meeting room quickly and easily.";


    renderBooking();

  }

  else {

    document.getElementById(
      "pageHeading"
    ).textContent =
      "My Bookings";


    document.getElementById(
      "pageSub"
    ).textContent =
      "View and manage your meeting room reservations.";


    renderHistory();

  }

}


/* =========================================
   BOOKING PAGE
========================================= */

function renderBooking() {
  const today = new Date().toISOString().split("T")[0];
  const dateInput = document.getElementById("date");
  dateInput.min = today;
  dateInput.value = state.date;
  document.getElementById("meetingTitle").value = state.meetingTitle;
  document.getElementById("participants").value = state.participants ?? "";
  document.getElementById("startTime").value = state.startTime;
  document.getElementById("endTime").value = state.endTime;
  document.getElementById("roomSetup").value = state.roomSetup;
  document.getElementById("additionalInstructions").value = state.additionalInstructions;
  document.getElementById("foodPreparation").value = state.foodPreparation;
  renderTimeOptions();

  document.getElementById("roomHelp").textContent = Number.isInteger(state.participants)
    ? `Rooms with ${state.participants} seats. Click a room to select it; its schedule is below.`
    : state.participants === "All"
      ? "Click a room to select it; its schedule is below."
      : "Select a room capacity, then click a room to see its schedule.";
  document.getElementById("roomList").innerHTML = renderRoomCalendar();
  updateSummary();
}

function updateSummary() {
  const summary = {
    date: [fmtDate(state.date), Boolean(state.date)],
    meetingTitle: [state.meetingTitle.trim() || "Not selected", Boolean(state.meetingTitle.trim())],
    participants: [state.participants === null ? "Not selected" : state.participants === "All" ? "Browsing all room capacities" : `${state.participants} people`, Number.isInteger(state.participants)],
    room: [state.room?.name || "Not selected", Boolean(state.room)],
    meetingTime: [state.meetingTime || "Not selected", Boolean(selectedTimeRange())],
    roomSetup: [state.roomSetup.trim() || "Not provided", Boolean(state.roomSetup.trim())],
    additionalInstructions: [state.additionalInstructions.trim() || "Not provided", Boolean(state.additionalInstructions.trim())],
    foodPreparation: [state.foodPreparation.trim() || "Not provided", Boolean(state.foodPreparation.trim())]
  };

  Object.entries(summary).forEach(([key, [value, complete]]) => {
    const row = document.querySelector(`[data-summary="${key}"]`);
    if (!row) return;
    row.querySelector(".sum-content strong").textContent = value;
    row.classList.toggle("complete", complete);
    row.querySelector(".sum-check").textContent = complete ? "✓" : "";
    row.querySelector(".sum-check").setAttribute("aria-label", complete ? "Complete" : "Incomplete");
  });

  const requiredCount = [
    Boolean(state.date),
    Boolean(state.meetingTitle.trim()),
    Number.isInteger(state.participants),
    Boolean(state.room),
    Boolean(selectedTimeRange()),
    Boolean(state.roomSetup.trim()),
    Boolean(state.additionalInstructions.trim()),
    Boolean(state.foodPreparation.trim())
  ].filter(Boolean).length;
  document.getElementById("progressCount").textContent = `${requiredCount} of 8`;
  document.getElementById("progressBar").style.width = `${requiredCount / 8 * 100}%`;
  document.querySelector(".progress-track").setAttribute("aria-valuenow", requiredCount);
  document.getElementById("statusBadge").textContent = checklistComplete() ? "Ready to Book" : "Draft";
}


/* =========================================
   RESET AFTER DATE
========================================= */

function resetAfterDate() {

  state.room = null;

  state.start = null;

  state.end = null;

  state.startTime = "";

  state.endTime = "";

  state.meetingTime = "";

}


/* =========================================
   ROOM FILTERING
========================================= */

function renderRoomCalendar() {
  if (state.participants === null) {
    return '<div class="calendar-empty">Select a room capacity to view matching rooms.</div>';
  }

  const matchingRooms = state.participants === "All"
    ? rooms
    : rooms.filter(room => room.capacity === state.participants);

  if (!matchingRooms.length) {
    return '<div class="calendar-empty">No rooms match this capacity.</div>';
  }

  return matchingRooms.map(room => {
    const totalBookings = state.date
      ? bookings.filter(booking =>
          booking.roomId === room.id &&
          booking.status === "Confirmed" &&
          booking.date === state.date
        ).length
      : 0;

    return `
      <button class="calendar-room ${state.room?.id === room.id ? "selected" : ""}"
        type="button" aria-pressed="${state.room?.id === room.id}"
        aria-label="Select ${room.name.replace(/\s*\(\d+\s*pax\)$/i, "")}, capacity ${room.capacity}"
        onclick="selectRoom(${room.id})">
        <strong>${room.name.replace(/\s*\(\d+\s*pax\)$/i, "")}</strong>
        <span>${room.capacity} people</span>
        ${state.date ? `<small>${totalBookings} booked that day</small>` : ""}
        <span class="calendar-room-amenities">
          <span class="amenities-label">Has:</span>
          ${room.amenities.map(amenity => `<span class="room-amenity">${amenity}</span>`).join("")}
        </span>
        ${roomAvailabilitySuggestions(room)}
        <span class="calendar-check" aria-hidden="true">✓</span>
      </button>
    `;
  }).join("");
}

function bookingTimeRange(booking) {
  if (
    Number.isInteger(booking.start) &&
    Number.isInteger(booking.end) &&
    booking.end > booking.start
  ) {
    return { start: booking.start, end: booking.end };
  }

  const parts = String(booking.meetingTime || "").split(/\s+-\s+/);
  if (parts.length !== 2) return null;

  const start = times.indexOf(parts[0]);
  const end = times.indexOf(parts[1]);
  return start >= 0 && end > start ? { start, end } : null;
}

function selectedTimeRange() {
  const start = times.indexOf(state.startTime);
  const end = times.indexOf(state.endTime);
  return start >= 0 && end > start
    ? { start, end }
    : null;
}

function roomTimeRangeIsAvailable(room, start, end) {
  if (!state.date || !room || end <= start) {
    return false;
  }

  return !bookings.some(booking => {
    if (
      booking.date !== state.date ||
      booking.roomId !== room.id ||
      booking.status !== "Confirmed"
    ) {
      return false;
    }

    const range = bookingTimeRange(booking);
    return range && rangesOverlap(start, end, range.start, range.end);
  });
}

function timeRangeIsAvailable(start, end) {
  return roomTimeRangeIsAvailable(state.room, start, end);
}

function roomAvailabilitySuggestions(room) {
  if (!state.date || !room) {
    return "";
  }

  const suggestions = times.slice(0, -1).filter((time, startIndex) =>
    times.slice(startIndex + 1).some((nextTime, offset) =>
      roomTimeRangeIsAvailable(room, startIndex, startIndex + offset + 1)
    )
  );

  if (!suggestions.length) {
    return '<div class="room-time-suggestions empty">No available times</div>';
  }

  const preview = suggestions.slice(0, 6).map(time => `<span class="room-time-pill">${time}</span>`).join("");
  return `
    <div class="room-time-suggestions">
      <span class="room-time-label">Available:</span>
      ${preview}
    </div>
  `;
}

function renderTimeOptions() {
  const startSelect = document.getElementById("startTime");
  const endSelect = document.getElementById("endTime");
  const canChooseRoomTime = Boolean(state.date && state.room);
  const availableStarts = canChooseRoomTime
    ? times.slice(0, -1).filter((time, start) =>
        times.slice(start + 1).some((endTime, offset) =>
          timeRangeIsAvailable(start, start + offset + 1)
        )
      )
    : [];

  const startPlaceholder = !state.date
    ? "Select a date first"
    : !state.room
      ? "Select a room below"
      : availableStarts.length
        ? "Select start time"
        : "No available start times";

  startSelect.innerHTML = `<option value="">${startPlaceholder}</option>${availableStarts
    .map(time => `<option value="${time}">${time}</option>`)
    .join("")}`;
  startSelect.disabled = !canChooseRoomTime || availableStarts.length === 0;

  if (!availableStarts.includes(state.startTime)) {
    state.startTime = "";
    state.start = null;
    state.endTime = "";
    state.end = null;
    state.meetingTime = "";
  }
  startSelect.value = state.startTime;

  const startIndex = times.indexOf(state.startTime);
  const availableEnds = startIndex >= 0
    ? times.slice(startIndex + 1).map((time, offset) => startIndex + offset + 1)
        .filter(end => timeRangeIsAvailable(startIndex, end))
    : [];
  const endPlaceholder = startIndex < 0
    ? "Select a start time first"
    : availableEnds.length
      ? "Select end time"
      : "No available end times";

  endSelect.innerHTML = `<option value="">${endPlaceholder}</option>${availableEnds
    .map(end => `<option value="${times[end]}">${times[end]}</option>`)
    .join("")}`;
  endSelect.disabled = startIndex < 0 || availableEnds.length === 0;

  if (!availableEnds.some(end => times[end] === state.endTime)) {
    state.endTime = "";
    state.end = null;
    state.meetingTime = "";
  }
  endSelect.value = state.endTime;
}


function roomHasAvailability(room) {

  if (!state.date) {
    return true;
  }


  const roomBookings =
    bookings.filter(
      booking =>
        booking.date === state.date &&
        booking.roomId === room.id &&
        booking.status === "Confirmed"
    );


  if (state.start !== null && state.end !== null && state.end > state.start) {
    return !roomBookings.some(
      booking =>
        rangesOverlap(
          state.start,
          state.end,
          booking.start,
          booking.end
        )
    );
  }


  if (state.start !== null) {
    return times.some(
      (time, endIndex) =>
        endIndex > state.start &&
        !roomBookings.some(
          booking =>
            rangesOverlap(
              state.start,
              endIndex,
              booking.start,
              booking.end
            )
        )
    );
  }


  return times.some(
    (time, startIndex) =>
      startIndex < times.length - 1 &&
      !roomBookings.some(
        booking =>
          startIndex >= booking.start &&
          startIndex < booking.end
      )
  );

}


/* =========================================
   PARTICIPANT SELECTION
========================================= */

function selectParticipants(number) {

  state.participants =
    number === "All"
      ? "All"
      : number === ""
        ? null
        : Number(number);

  state.room = null;

  state.start = null;

  state.end = null;

  state.startTime = "";

  state.endTime = "";

  state.meetingTime = "";

  renderBooking();

}


/* =========================================
   ROOM SELECTION
========================================= */

function selectRoom(id) {

  state.room =
    rooms.find(
      room => room.id === id
    );

  state.start = null;

  state.end = null;

  state.startTime = "";

  state.endTime = "";

  state.meetingTime = "";

  renderBooking();

}


/* =========================================
   TIME SELECTION
========================================= */

function isTimeUnavailable(start, end) {

  if (!state.date || !state.room) {
    return false;
  }


  const roomBookings =
    bookings.filter(
      booking =>
        booking.date === state.date &&
        booking.roomId === state.room.id &&
        booking.status === "Confirmed"
    );


  return roomBookings.some(
    booking => {
      const range = bookingTimeRange(booking);
      return range && rangesOverlap(start, end, range.start, range.end);
    }
  );

}

function selectTime(slotStart, slotEnd) {

  let nextStart = slotStart;
  let nextEnd = slotEnd;

  if (state.start !== null && state.end !== null) {
    if (slotStart === state.start && slotEnd === state.end) {
      state.start = null;
      state.end = null;
      renderBooking();
      return;
    }

    if (slotStart >= state.end) {
      nextStart = state.start;
    }
    else if (slotEnd <= state.start) {
      nextEnd = state.end;
    }
  }

  if (isTimeUnavailable(nextStart, nextEnd)) {
    showToast("That time range overlaps an existing booking.");
    return;
  }

  state.start = nextStart;
  state.end = nextEnd;

  renderBooking();

}


/* =========================================
   DURATION
========================================= */

function duration() {

  const minutes =
    (state.end - state.start) * 30;


  const hours =
    Math.floor(minutes / 60);


  const mins =
    minutes % 60;


  return formatDuration(
    hours,
    mins
  );

}


function formatDuration(hours, minutes) {

  let result = "";


  if (hours) {

    result +=
      `${hours} hour${hours !== 1 ? "s" : ""}`;

  }


  if (hours && minutes) {

    result += " ";

  }


  if (minutes) {

    result +=
      `${minutes} minute${minutes !== 1 ? "s" : ""}`;

  }


  return result || "0 minutes";

}


/* =========================================
   READY CHECK
========================================= */

function ready() {

  return Boolean(

    state.date &&

    state.meetingTitle.trim() &&

    Number.isInteger(state.participants) &&

    state.room &&

    selectedTimeRange() &&

    state.roomSetup.trim() &&

    state.additionalInstructions.trim() &&

    state.foodPreparation.trim()

  );

}


function incompleteChecklistItems() {
  return [
    [Boolean(state.date), "Meeting Date"],
    [Boolean(state.meetingTitle.trim()), "Meeting Title"],
    [Number.isInteger(state.participants), "Room Capacity"],
    [Boolean(state.room), "Meeting Room"],
    [Boolean(selectedTimeRange()), "Meeting Time"],
    [Boolean(state.roomSetup.trim()), "Room Setup"],
    [Boolean(state.additionalInstructions.trim()), "Additional Instructions"],
    [Boolean(state.foodPreparation.trim()), "Food/coffee preparation"]
  ]
    .filter(([complete]) => !complete)
    .map(([, label]) => label);
}


function checklistComplete() {
  return incompleteChecklistItems().length === 0;
}


function focusFirstIncompleteItem() {
  const firstIncomplete = incompleteChecklistItems()[0];
  const selectors = {
    "Meeting Date": "#date",
    "Meeting Title": "#meetingTitle",
    "Room Capacity": "#participants",
    "Meeting Room": "#roomList",
    "Meeting Time": "#startTime",
    "Room Setup": "#roomSetup",
    "Additional Instructions": "#additionalInstructions",
    "Food/coffee preparation": "#foodPreparation"
  };
  const target = document.querySelector(selectors[firstIncomplete]);

  if (!target) return;

  target.scrollIntoView({ behavior: "smooth", block: "center" });
  if (target.matches("input, select, textarea")) {
    target.focus({ preventScroll: true });
  }
}


/* =========================================
   BOOK NOW
========================================= */

function bookNow() {

  const incompleteItems = incompleteChecklistItems();

  if (incompleteItems.length) {
    showModal(`

      <div class="center">

        <div class="warning-icon" aria-hidden="true">!</div>

        <h2>
          Booking checklist incomplete
        </h2>

        <p>
          Complete these items before booking:
          ${esc(incompleteItems.join(", "))}.
        </p>

        <div class="modal-actions">
          <button class="primary" onclick="closeModal(); focusFirstIncompleteItem();">
            Review checklist
          </button>
        </div>

      </div>

    `);

    return;
  }

  if (!ready()) {
    return;
  }


  showModal(`

    <div class="center">

      <div class="success">
        ✓
      </div>

      <h2>
        Checking availability...
      </h2>

      <p>
        Please wait while we perform
        the final room availability check.
      </p>

    </div>

  `);


  setTimeout(
    function () {

      const selectedRange = selectedTimeRange();
      const conflict = bookings.some(booking => {
        if (
          booking.date !== state.date ||
          booking.roomId !== state.room.id ||
          booking.status !== "Confirmed"
        ) {
          return false;
        }

        const range = bookingTimeRange(booking);
        return range && rangesOverlap(selectedRange.start, selectedRange.end, range.start, range.end);
      });

      if (conflict) {
        showModal(`
          <div class="center">
            <h2>Room No Longer Available</h2>
            <p>This room is already booked for the selected time.</p>
            <div class="modal-actions">
              <button class="secondary" onclick="closeModal()">Choose Another Time</button>
              <button class="primary" onclick="closeModal(); state.room=null; state.start=null; state.end=null; renderBooking();">Choose Another Room</button>
            </div>
          </div>
        `);
        return;
      }

      /*
        CREATE BOOKING
      */

      const booking = {

        id:
          "MRB-" +
          new Date().getFullYear() +
          "-" +
          String(Date.now()).slice(-5),

        meetingTitle:
          state.meetingTitle.trim(),

        roomSetup:
          state.roomSetup.trim(),

        additionalInstructions:
          state.additionalInstructions.trim(),

        foodPreparation:
          state.foodPreparation.trim(),

        date:
          state.date,

        participants:
          state.participants,

        roomId:
          state.room.id,

        room:
          state.room.name,

        floor:
          state.room.floor,

        meetingTime:
          state.meetingTime,

        start:
          selectedRange.start,

        end:
          selectedRange.end,

        timeIndexVersion:
          2,

        status:
          "Confirmed",

        created:
          new Date().toISOString()

      };


      bookings.unshift(
        booking
      );


      save();


      showModal(`

        <div class="center">

          <div class="success">
            ✓
          </div>

          <h2>
            Booking Confirmed!
          </h2>

          <p>

            Your meeting room has been
            successfully reserved.

          </p>


          ${detailHTML(booking)}


          <div class="modal-actions">

            <button
              class="secondary"
              onclick="
                closeModal();
                showPage('history');
              "
            >

              View My Bookings

            </button>

            

            <button
              class="primary"
              onclick="
                closeModal();
                newBooking();
              "
            >

              Book Another Room

            </button>

          </div>

        </div>

      `);

    },

    700
  );

}


/* =========================================
   CHECK TIME CONFLICT
========================================= */

function rangesOverlap(
  startA,
  endA,
  startB,
  endB
) {

  return (
    startA < endB &&
    startB < endA
  );

}


/* =========================================
   BOOKING DETAILS
========================================= */

function detailHTML(booking) {

  return `

    <div class="detail-grid">

      ${detail(
        "Meeting Title",
        booking.meetingTitle || "Untitled Meeting"
      )}

      ${detail(
        "Date",
        fmtDate(booking.date)
      )}

      ${detail(
        "Room Capacity Filter",
        Array.isArray(booking.participants)
          ? booking.participants.join(" or ") + " people"
          : booking.participants + " People"
      )}

      ${detail(
        "Room",
        booking.room
      )}

      ${detail(
        "Location",
        booking.floor
      )}

      ${detail(
        "Room Setup",
        booking.roomSetup || "None provided"
      )}

      ${detail(
        "Additional instructions",
        booking.additionalInstructions || "None provided"
      )}

      ${detail(
        "Food/coffee preparation",
        booking.foodPreparation || "None provided"
      )}

      ${detail(
        "Time",
        booking.meetingTime || "Not specified"
      )}

      ${detail(
        "Status",
        booking.status
      )}

    </div>

  `;

}


function detail(label, value) {

  return `

    <div class="detail-row">

      <span>
        ${label}
      </span>

      <strong>
        ${esc(value)}
      </strong>

    </div>

  `;

}


/* =========================================
   CALCULATE DURATION
========================================= */

function calcDuration(
  start,
  end
) {

  const minutes =
    (end - start) * 30;


  const hours =
    Math.floor(minutes / 60);


  const mins =
    minutes % 60;


  return formatDuration(
    hours,
    mins
  );

}


/* =========================================
   NEW BOOKING
========================================= */

function newBooking() {

  state.date = "";

  state.meetingTitle = "";

  state.roomSetup = "";

  state.additionalInstructions = "";

  state.foodPreparation = "";

  state.participants = null;

  state.room = null;

  state.start = null;

  state.end = null;

  state.meetingTime = "";
  state.startTime = "";
  state.endTime = "";

  showPage("book");

}


/* =========================================
   MY BOOKINGS
========================================= */

function renderHistory() {
  document.getElementById("historyDate").value = state.historyDate;
  const filtered =
    bookings.filter(
      booking => {

        const matchesDate =
          !state.historyDate ||
          booking.date === state.historyDate;


        return matchesDate;

      }
    );


  document.getElementById("historyList").innerHTML = filtered.length
    ? filtered.map(historyCard).join("")
    : '<div class="no-history">No bookings found.</div>';

}


/* =========================================
   HISTORY CARD
========================================= */

function historyCard(booking) {

  return `

    <article class="history-item">


      <div class="history-main">

        <div class="history-meta">

          ${hist(
            "Meeting Title",
            booking.meetingTitle || "Untitled Meeting"
          )}

          ${hist(
            "Meeting Room",
            booking.room
          )}

          ${hist(
            "Date",
            fmtDate(booking.date)
          )}

          ${hist(
            "Time",
            booking.meetingTime || "Not specified"
          )}

        </div>

      </div>


      <div class="history-actions">

        <span
          class="history-status ${booking.status === "Cancelled" ? "cancelled" : "confirmed"}"
        >
          ${booking.status === "Cancelled" ? "Cancelled" : "Booked"}
        </span>

        <div class="history-buttons">
          ${booking.status !== "Cancelled" ? `
            <button
              class="details-btn"
              onclick="cancelBooking('${booking.id}')"
            >
              Cancel Booking
            </button>
          ` : ""}
          ${booking.status === "Cancelled" ? `
            <button
              class="delete-btn"
              type="button"
              title="Delete booking"
              aria-label="Delete booking ${esc(booking.meetingTitle || booking.room)}"
              onclick="confirmDeleteBooking('${esc(booking.id)}')"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="m19 6-1 14H6L5 6" />
                <path d="M10 11v5M14 11v5" />
              </svg>
            </button>
          ` : ""}
        </div>

      </div>


    </article>

  `;

}


/* =========================================
   HISTORY INFORMATION
========================================= */

function hist(
  label,
  value
) {

  return `

    <div>

      <span>
        ${label}
      </span>

      <strong>
        ${esc(value)}
      </strong>

    </div>

  `;

}


/* =========================================
   VIEW BOOKING
========================================= */

function viewBooking(id) {

  const booking =
    bookings.find(
      item =>
        item.id === id
    );


  if (!booking) {
    return;
  }


  showModal(`

    <h2>
      Booking Details
    </h2>

    <p>

      ${
        booking.status ===
        "Confirmed"

          ? "Your reservation details are shown below."

          : "This reservation is no longer active."
      }

    </p>


    ${detailHTML(booking)}


    <div class="modal-actions">

      ${
        booking.status === "Confirmed"

          ? `

            <button
              class="danger"
              onclick="
                cancelBooking('${booking.id}')
              "
            >

              Cancel Booking

            </button>

          `

          : ""
      }


      <button
        class="secondary"
        onclick="closeModal()"
      >

        Close

      </button>

    </div>

  `);

}


/* =========================================
   CANCEL BOOKING
========================================= */

function cancelBooking(id) {

  const booking =
    bookings.find(
      item =>
        item.id === id
    );


  if (!booking) {
    return;
  }


  booking.status =
    "Cancelled";


  save();


  closeModal();


  showToast(
    "Booking cancelled."
  );


  renderHistory();

}


function confirmDeleteBooking(id) {
  const booking = bookings.find(item => item.id === id);
  if (!booking || booking.status !== "Cancelled") return;

  showModal(`
    <h2>Delete this booking?</h2>
    <p>This will permanently remove ${esc(booking.meetingTitle || booking.room)} from your booking history.</p>
    <div class="modal-actions">
      <button class="secondary" onclick="closeModal()">Keep in History</button>
      <button class="danger" onclick="deleteBooking('${esc(id)}')">Delete Booking</button>
    </div>
  `);
}


function deleteBooking(id) {
  const bookingIndex = bookings.findIndex(item => item.id === id);
  if (bookingIndex === -1) return;

  bookings.splice(bookingIndex, 1);
  save();
  closeModal();
  showToast("Booking deleted.");
  renderHistory();
}


/* =========================================
   MODAL
========================================= */

function showModal(html) {

  document.getElementById(
    "modal"
  ).innerHTML = `

    <div class="modal-box">

      ${html}

    </div>

  `;


  document
    .getElementById("modal")
    .classList
    .add("show");

}


function closeModal() {

  document
    .getElementById("modal")
    .classList
    .remove("show");

}


/* =========================================
   TOAST
========================================= */

function showToast(message) {

  const toast =
    document.getElementById(
      "toast"
    );


  toast.textContent =
    message;


  toast.classList.add(
    "show"
  );


  setTimeout(
    function () {

      toast.classList.remove(
        "show"
      );

    },

    2500
  );

}


/* =========================================
   START APPLICATION
========================================= */

render();