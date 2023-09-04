let calendarDate = new Date();
class Calendar {
	constructor({ elem, year, month }) {
		this.elem = elem;
		this.year = year;
		this.month = month;
		this.date = new Date(year, month - 1);
		this._insertCalendar();
	}
	_addRow(table) {
		let row = document.createElement("tr");
		table.append(row);
	}
	_addCell(row) {
		let cell = document.createElement("td");
		row.append(cell);
	}
	_getMonthString() {
		let months = [
			"1月",
			"2月",
			"3月",
			"4月",
			"5月",
			"6月",
			"7月",
			"8月",
			"9月",
			"10月",
			"11月",
			"12月"
		];
		return months[this.date.getMonth()];
	}
	_constructTable() {
		let table = document.createElement("table");
		let editButton = document.createElement("button");
		editButton.className = "btn btn-sm ml-1 btn-outline-secondary border border-secondary rounded edit-holiday-btn";
		editButton.setAttribute("data-month", this.month);
		editButton.setAttribute("data-year", this.year);
		let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
		editButton.innerHTML = svg;
		table.innerHTML =
			'<table class="table-calendar"><thead><tr><th></th></tr><tr><th class="sunday">日</th><th>月</th><th>火</th><th>水</th><th>木</th><th>金</th><th class="saturday">土</th></tr></thead><tbody></tbody></table>';
		table.rows[0].cells[0].colSpan = 7;
		table.rows[0].cells[0].innerHTML = this.year + "年 " + this._getMonthString();
		table.rows[0].cells[0].append(editButton);
		table.rows[0].cells[0].classList.add("year-and-month")
		for (let row = 2; row < 8; row++) {
			this._addRow(table.tBodies[0]);
			table.rows[row].dataset.week = "" + (row - 1);
			for (let cell = 0; cell < 7; cell++) {
				this._addCell(table.rows[table.rows.length - 1]);
				// if (cell === 0) {
				// table.rows[row].cells[cell].dataset.weekDay = "" + 0;
				// } else 
				// table.rows[row].cells[cell].dataset.weekDay = "" + (cell + 1);
				table.rows[row].cells[cell].dataset.weekDay = "" + cell;
			}
		}
		return table;
	}
	_constructCalendar() {
		let table = this._constructTable();
		table.classList.add("table-calendar");
		outer: while (this.date.getMonth() < this.month) {
			let d = 0;
			for (let row = 2; row < 8; row++) {
				for (let cell = 0; cell < 7; cell++) {
					this.date.setDate(this.date.getDate() + d);
					if (this.date.getDay() != table.rows[2].cells[cell].dataset.weekDay)
						continue;
					if (
						this.date.getMonth() > this.month - 1 ||
						(this.date.getMonth() == 0 && this.month == 12)
					) {
						while (table.rows[table.rows.length - 1].cells[0].innerHTML === "")
							table.tBodies[0].lastElementChild.remove();
						break outer;
					}
					table.rows[row].cells[cell].innerHTML = "" + this.date.getDate();
					d = 1;
				}
			}
			this.date.setDate(calendarDate.getDate() + d);
		}
		return table;
	}
	_insertCalendar() {
		let calendar = this._constructCalendar();
		// let calendarDate = new Date();
		for (let week = 0; week < calendar.rows.length; week++) {
			for (let day = 0; day < calendar.rows[week].cells.length; day++) {
				let currentDay = calendar.rows[week].cells[day];
				if (
					date.getDate() == currentDay.innerHTML &&
					date.getMonth() === this.month - 1 &&
					date.getFullYear() === this.year
				) {
					currentDay.classList.add("today");
				}
				if (currentDay.dataset.weekDay == 0)
					currentDay.classList.add("sunday");
				if (currentDay.dataset.weekDay == 6)
					currentDay.classList.add("saturday");
			}
		}
		this.elem.append(calendar);
	}
}


function createDiv() {
	return document.createElement("div");
}

function createMonthCalendar() {
	let calendar = new Calendar({
		elem: this.node,
		year: calendarDate.getFullYear(),
		month: this.index
	});
	this.node.id = this.name;
	this.node.classList.add("month");
	return this.node;
}