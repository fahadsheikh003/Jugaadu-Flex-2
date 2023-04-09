const form = document.getElementById("control-row");

form.addEventListener("submit", handleFormSubmit);

async function handleFormSubmit(event) {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let url;
  if (tab?.url) {
    try {
      url = new URL(tab.url);
      if (url.hostname !== "flexstudent.nu.edu.pk") {
        alert("Please open the FlexStudent website first.");
        return;
      }
    } catch {}
  }

  chrome.scripting.executeScript({ target: { tabId: tab.id }, function: doneStuff });
}

async function doneStuff() {
  if (!window.location.href.includes("Student/StudentMarks")) {
    alert("Please change path to Student/StudentMarks");
    return;
  }

  const getTd = (className, id) => {
    const td = document.createElement('td');
    td.classList.add("text-center");
    td.classList.add(className);
    td.id = id;
    return td;
  }

  const getTr = (id) => {
    const tr = document.createElement('tr');
    tr.classList.add("totalColumn_" + id);
    tr.appendChild(getTd("totalColGrandTotal", "GrandtotalColMarks_" + id));
    tr.appendChild(getTd("totalColObtMarks", "GrandtotalObtMarks_" + id));
    tr.appendChild(getTd("totalColAverageMark", "GrandtotalClassAvg_" + id));
    tr.appendChild(getTd("totalColMinMarks", "GrandtotalClassMin_" + id));
    tr.appendChild(getTd("totalColMaxMarks", "GrandtotalClassMax_" + id));
    tr.appendChild(getTd("totalColStdDev", "GrandtotalClassStdDev_" + id));
    return tr;
  }

  async function set_marks(courseId, id) {
    var temp = "totalColumn_" + id;
    var grandTotal = 0;
    var totalObtained = 0;
    var totalAverage = 0;
    var totalMinimum = 0;
    var totalMaximum = 0;

    const course = document.getElementById(courseId);
    if (!course) {
      return;
    }
    const totalRows = course.querySelectorAll(`.${temp}`);
    if (!totalRows) {
      return;
    }
    for (let i = 0; i < totalRows.length; i++) {
      const row = totalRows[i];
      const weightage = row.querySelector('.totalColweightage');
      if (weightage && weightage.textContent != "") {
        grandTotal += parseFloat(weightage.textContent);
      }
      const obtMarks = row.querySelector('.totalColObtMarks');
      if (obtMarks && obtMarks.textContent != "") {
        totalObtained += parseFloat(obtMarks.textContent);
      }
    }
    const calculationRows = course.querySelectorAll(`.calculationrow`);
    if (!calculationRows) {
      return;
    }
    for (let i = 0; i < calculationRows.length; i++) {
      const row = calculationRows[i];
      const averageMarks = row.querySelector('.AverageMarks');
      const totalMarks = row.querySelector('.GrandTotal');
      const minMarks = row.querySelector('.MinMarks');
      const maxMarks = row.querySelector('.MaxMarks');
      const weightage = row.querySelector('.weightage');
      if (averageMarks && averageMarks.textContent != "" && totalMarks && totalMarks.textContent != "" && weightage && weightage.textContent != "" && minMarks && minMarks.textContent != "" && maxMarks && maxMarks.textContent != "") {
        const avg = parseFloat(averageMarks.textContent) * parseFloat(weightage.textContent) / parseFloat(totalMarks.textContent);
        totalAverage += avg;

        const min = parseFloat(minMarks.textContent) * parseFloat(weightage.textContent) / parseFloat(totalMarks.textContent);
        totalMinimum += min;

        const max = parseFloat(maxMarks.textContent) * parseFloat(weightage.textContent) / parseFloat(totalMarks.textContent);
        totalMaximum += max;
      }
    }
    if ((!isNaN(grandTotal))) {
      document.getElementById(`GrandtotalColMarks_${id}`).textContent = grandTotal.toFixed(2);
    }
    if ((!isNaN(totalObtained))) {
      document.getElementById(`GrandtotalObtMarks_${id}`).textContent = totalObtained.toFixed(2);
    }
    if ((!isNaN(totalAverage))) {
      document.getElementById(`GrandtotalClassAvg_${id}`).textContent = totalAverage.toFixed(2);
    }
    if ((!isNaN(totalMinimum))) {
      document.getElementById(`GrandtotalClassMin_${id}`).textContent = totalMinimum.toFixed(2);
    }
    if ((!isNaN(totalMaximum))) {
      document.getElementById(`GrandtotalClassMax_${id}`).textContent = totalMaximum.toFixed(2);
    }
  }

  const courses = document.querySelectorAll(`div[class*='tab-pane']`); // Get all courses
  for (let i = 0; i < courses.length; i++) {
    const courseId = courses[i].id;
    const button = courses[i].querySelector(`button[onclick*="ftn_calculateMarks"]`);
    if (button) {
      const id = parseInt(button.getAttribute('onclick').substring(20, 24));
      const newTr = getTr(id);
      courses[i].querySelector(`div[id=${courses[i].id}-Grand_Total_Marks]`).querySelector('tbody').appendChild(newTr);
      set_marks(courseId, id);
    }
  }
}
