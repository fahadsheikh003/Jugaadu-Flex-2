const marksForm = document.getElementById("grand-marks");
marksForm.addEventListener("submit", handleMarksFormSubmit);

const feedbackForm = document.getElementById("feedback-form");
feedbackForm.addEventListener("submit", handleFeedbackFormSubmit);

const gpaCalculatorForm = document.getElementById("gpa-calculator");
gpaCalculatorForm.addEventListener("submit", handleCalculatorFormSubmit);

async function handleMarksFormSubmit(event) {
  event.preventDefault();
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

  chrome.scripting.executeScript({ target: { tabId: tab.id }, function: marksMainFunction });
}

async function handleCalculatorFormSubmit(event) {
  event.preventDefault();
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

  chrome.scripting.executeScript({ target: { tabId: tab.id }, function: calculatorMainFunction });
}

async function handleFeedbackFormSubmit(event) {
  event.preventDefault();
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

  const input = document.querySelector('input[name="feedback-radio"]:checked');
  if (!input) {
    alert("Please select a feedback option first.");
    return;
  }

  chrome.scripting.executeScript({ target: { tabId: tab.id }, function: feedbackMainFunction, args: [input.value] });
}

async function marksMainFunction() {
  if (!window.location.href.includes("Student/StudentMarks")) {
    alert("Please Open Marks Page First");
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

  const parseFloatOrZero = (value) => {
    const parsedValue = parseFloat(value);
    return isNaN(parsedValue) ? 0 : parsedValue;
  }

  const checkBestOff = (section, weightage) => {
    const calculationRows = section.querySelectorAll(`.calculationrow`);
    let weightsOfAssessments = 0;
    let count = 0;
    for (let row of calculationRows) {
      const weightageOfAssessment = parseFloatOrZero(row.querySelector('.weightage').textContent);
      weightsOfAssessments += weightageOfAssessment;

      if (weightage < weightsOfAssessments) {
        return count;
      }
      count++;
    }
    return count;
  }

  const reorderCalculationRows = (section, bestOff) => {
    const sectionArray = Array.from(section.querySelectorAll(`.calculationrow`));
    sectionArray.sort((a, b) => {
      const aObtained = parseFloatOrZero(a.querySelector('.ObtMarks').textContent);
      const bObtained = parseFloatOrZero(b.querySelector('.ObtMarks').textContent);
      return bObtained - aObtained;
    });
    return sectionArray.slice(0, bestOff);
  }

  async function set_marks(courseId, id) {
    const course = document.getElementById(courseId);
    const sections = course.querySelectorAll(`div[id^="${courseId}"]:not([id$="Grand_Total_Marks"])`);

    let globalWeightage = 0;
    let globalObtained = 0;
    let globalAverage = 0;
    let globalMinimum = 0;
    let globalMaximum = 0;
    
    for (let section of sections) {
      const totalRow = section.querySelector(`.totalColumn_${id}`);
      const localWeightage = parseFloat(totalRow.querySelector('.totalColweightage').textContent);
      const localObtained = parseFloat(totalRow.querySelector('.totalColObtMarks').textContent);

      globalWeightage += localWeightage;
      globalObtained += localObtained;

      // Check if there are any best off marks
      const bestOff = checkBestOff(section, localWeightage);
      const calculationRows = reorderCalculationRows(section, bestOff);

      for (let row of calculationRows) {
        const weightage = parseFloatOrZero(row.querySelector('.weightage').textContent);
        const obtained = parseFloatOrZero(row.querySelector('.ObtMarks').textContent);
        const total = parseFloatOrZero(row.querySelector('.GrandTotal').textContent);
        const average = parseFloatOrZero(row.querySelector('.AverageMarks').textContent);
        const minimum = parseFloatOrZero(row.querySelector('.MinMarks').textContent);
        const maximum = parseFloatOrZero(row.querySelector('.MaxMarks').textContent);

        globalAverage += average * (weightage / total);
        globalMinimum += minimum * (weightage / total);
        globalMaximum += maximum * (weightage / total);
      }
    }

    document.getElementById(`GrandtotalColMarks_${id}`).textContent = globalWeightage.toFixed(2);
    document.getElementById(`GrandtotalObtMarks_${id}`).textContent = globalObtained.toFixed(2);
    document.getElementById(`GrandtotalClassAvg_${id}`).textContent = globalAverage.toFixed(2);
    document.getElementById(`GrandtotalClassMin_${id}`).textContent = globalMinimum.toFixed(2);
    document.getElementById(`GrandtotalClassMax_${id}`).textContent = globalMaximum.toFixed(2);
  }

  const courses = document.querySelectorAll(`div[class*='tab-pane']`); // Get all courses

  for (let i = 0; i < courses.length; i++) {
    const courseId = courses[i].id;
    const button = courses[i].querySelector(`button[onclick*="ftn_calculateMarks"]`);
    if (button) {
      const id = parseInt(button.getAttribute('onclick').substring(20, 24));
      const newTr = getTr(id);
      courses[i].querySelector(`div[id=${courses[i].id}-Grand_Total_Marks]`).querySelector('tbody').innerHTML = '';
      courses[i].querySelector(`div[id=${courses[i].id}-Grand_Total_Marks]`).querySelector('tbody').appendChild(newTr);
      set_marks(courseId, id);
    }
  }
}

async function feedbackMainFunction(input) {
  if (!window.location.href.includes("Student/FeedBackQuestions")) {
    alert("Please Open Feedback Page of a Specific Course First");
    return;
  }

  function selectSpecificRadio(element, input) {
    const radioButtonsSpan = element.getElementsByClassName('m-list-timeline__time');
    for (let i = 0; i < radioButtonsSpan.length; i++) {
        if (radioButtonsSpan[i].textContent.trim() === input) {
            const radioButton = radioButtonsSpan[i].querySelector('input[type="radio"]');
            radioButton.checked = true;
            break;
        }
    }
  }
  
  function selectSpecificFeedback(input) {
    const questions = document.getElementsByClassName('m-list-timeline__item');
    Array.from(questions).forEach(question => {
        selectSpecificRadio(question, input);
    });
  }
  
  function selectRandomFeedback() {
    const questions = document.getElementsByClassName('m-list-timeline__item');
    Array.from(questions).forEach(question => {
        const radioButtonsSpan = question.getElementsByClassName('m-list-timeline__time');
        const randomIndex = Math.floor(Math.random() * radioButtonsSpan.length);
        const radioButton = radioButtonsSpan[randomIndex].querySelector('input[type="radio"]');
        radioButton.checked = true;
    });
  }

  input === "Randomize" ? selectRandomFeedback() : selectSpecificFeedback(input);
} 


async function calculatorMainFunction() {
  if (!window.location.href.includes("Student/Transcript")) {
    alert("Please Open Transcript Page first");
    return;
  }

  const getSelect = (currGrade) => {
    return `<select>
      <option value="-1">-</option>
      <option value="4" ${currGrade == 'A+' || currGrade == 'A' ? 'selected' : ''}>A/A+</option>
      <option value="3.67 ${currGrade == 'A-' ? 'selected' : ''}">A-</option>
      <option value="3.33" ${currGrade == 'B+' ? 'selected' : ''}>B+</option>
      <option value="3" ${currGrade == 'B' ? 'selected' : ''}>B</option>
      <option value="2.67" ${currGrade == 'B-' ? 'selected' : ''}>B-</option>
      <option value="2.33" ${currGrade == 'C+' ? 'selected' : ''}>C+</option>
      <option value="2" ${currGrade == 'C' ? 'selected' : ''}>C</option>
      <option value="1.67" ${currGrade == 'C-' ? 'selected' : ''}>C-</option>
      <option value="1.33" ${currGrade == 'D+' ? 'selected' : ''}>D+</option>
      <option value="1" ${currGrade == 'D' ? 'selected' : ''}>D</option>
      <option value="0" ${currGrade == 'F' ? 'selected' : ''}>F</option>
    </select>`;
  }

  const getSUcredithours = () => {
    return Array.from(document.getElementsByTagName('td'))
        .filter((td) => td.innerText == 'S' || td.innerText == 'U')
        .reduce((total, curr) => total + parseInt(curr.previousElementSibling.innerText), 0);
  }

  let semesters = document.getElementsByClassName("col-md-6");
  let lastSemester = semesters[semesters.length - 1];
  let spans = lastSemester.querySelectorAll("span");
  
  let cgpa = 0;
  let cgpaelem = spans[2];
  let sgpaelem = spans[3];

  let crEarned = 0;

  if(semesters.length > 1){
    let secondLastSemester = semesters[semesters.length - 2];
    crEarned = parseInt(secondLastSemester.querySelectorAll("span")[1].innerText.split(':')[1]);
    cgpa = parseFloat(secondLastSemester.querySelectorAll("span")[2].innerText.split(':')[1]);
  }
 
  let rows = lastSemester.querySelectorAll('tbody > tr');

  for (let row of rows) {
    row.querySelectorAll('td.text-center')[1].innerHTML = getSelect(row.querySelectorAll('td.text-center')[1].innerText);
  }

  const getCorrespondingCreditHours = (selectelem) => parseInt(selectelem.parentElement.previousElementSibling.innerText);

  const handleSelectChange = (e) => {
    let selects = document.getElementsByTagName('select');
    let totalCreditHours = 0;
    let totalGradePoints = 0;
    for (let select of selects) {
      if (select.value != -1) {
        totalCreditHours += getCorrespondingCreditHours(select);
        totalGradePoints += parseFloat(getCorrespondingCreditHours(select)) * parseFloat(select.value);
        select.parentElement.nextElementSibling.innerText = select.value;
        select.parentElement.nextElementSibling.style.fontWeight = 'bold';
      } else {
        select.parentElement.nextElementSibling.innerText = '-';
        select.parentElement.nextElementSibling.style.fontWeight = 'normal';
      }
    }
    if (totalCreditHours == 0) {
      cgpaelem.innerHTML = `CGPA: ${cgpa.toFixed(2)}`;
      sgpaelem.innerHTML = `SGPA: 0`;
      return;
    }
    let calculatedSGPA = totalGradePoints / totalCreditHours;
    let actualCreditHoursEarned = crEarned - getSUcredithours();
    let calculatedCGPA = (cgpa * actualCreditHoursEarned + calculatedSGPA * totalCreditHours) / (actualCreditHoursEarned + totalCreditHours);

    cgpaelem.innerHTML = `CGPA: ${calculatedCGPA.toFixed(2)}`;
    sgpaelem.innerHTML = `SGPA: ${calculatedSGPA.toFixed(2)}`;

    // set cgpaelem and sgpaelem to bold
    cgpaelem.style.fontWeight = 'bold';
    sgpaelem.style.fontWeight = 'bold';
  }

  // add event listener to all select elements
  Array.from(document.getElementsByTagName('select')).forEach((select) => {
    select.addEventListener('change', handleSelectChange)
  });

  handleSelectChange();
}