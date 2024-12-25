// document.addEventListener('DOMContentLoaded', () => {
//     const errorMessage = document.getElementById('errorMessage');
//     const scoreForm = document.getElementById('scoreForm');
//     const recentScoresDiv = document.getElementById('recentScores');
//     const filterForm = document.getElementById('filterForm');
//     const clearFilterBtn = document.getElementById('clearFilter');
//     const averagesContainer = document.getElementById('averagesContainer');

//     // If we are on index page
//     if (scoreForm) {
//         scoreForm.addEventListener('submit', async (e) => {
//             e.preventDefault();
//             errorMessage.textContent = '';

//             const formData = new FormData(scoreForm);

//             // Validate all fields before sending
//             for (let [name, value] of formData.entries()) {
//                 if (!value && name !== 'playerName') {
//                     errorMessage.textContent = 'Please fill all fields correctly.';
//                     return;
//                 }
//                 if (name.startsWith('hole')) {
//                     const score = parseInt(value);
//                     if (isNaN(score) || score < 1 || score > 5) {
//                         errorMessage.textContent = 'Scores must be between 1 and 5.';
//                         return;
//                     }
//                 }
//             }

//             const urlParams = new URLSearchParams();
//             for (let [key, value] of formData.entries()) {
//                 urlParams.append(key, value);
//             }

//             const response = await fetch('server.py', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/x-www-form-urlencoded'
//                 },
//                 body: urlParams
//             });

//             const result = await response.text();
//             if (result.trim() === 'success') {
//                 scoreForm.reset();
//                 loadRecentScores();
//             } else {
//                 errorMessage.textContent = 'Error submitting score.';
//             }
//         });

//         // async function loadRecentScores() {
//         //     const response = await fetch('server.py?action=get_recent_scores');
//         //     const text = await response.text();
//         //     const lines = text.trim().split('\n').filter(line => line);
//         //     recentScoresDiv.innerHTML = '';
//         //     lines.forEach(line => {
//         //         const parts = line.split(',');
//         //         // parts: [datetime, hole1, hole2, ..., hole9, player]
//         //         const datetime = parts[0];
//         //         const holes = parts.slice(1, 10);
//         //         const player = parts[10];
//         //         const total = holes.reduce((sum, h) => sum + parseInt(h), 0);

//         //         // Reformat the date
//         //         const [datePart, timePart] = datetime.split(' ');
//         //         const [year, month, day] = datePart.split('-');
//         //         const shortYear = year.slice(-2);
//         //         const formattedDate = `${month}/${day}/${shortYear}`;

//         //         const div = document.createElement('div');
//         //         div.classList.add('score-card');
//         //         div.innerHTML = `${holes.join(' ')} , ${total} , ${formattedDate}, ${player}`;
//         //         recentScoresDiv.appendChild(div);
//         //     });
//         // }

//         async function loadRecentScores() {
//             const response = await fetch('server.py?action=get_recent_scores');
//             const text = await response.text();
//             const lines = text.trim().split('\n').filter(line => line);
//             recentScoresDiv.innerHTML = '';

//             // Create table and table header
//             const table = document.createElement('table');
//             table.style.width = '100%';
//             table.style.borderCollapse = 'collapse';
//             const thead = document.createElement('thead');
//             const headerRow = document.createElement('tr');

//             // Define table headers
//             const headers = ['Holes', 'Total', 'Date', 'Player'];
//             headers.forEach(h => {
//                 const th = document.createElement('th');
//                 th.textContent = h;
//                 th.style.textAlign = 'left';
//                 th.style.borderBottom = '1px solid #ccc';
//                 th.style.padding = '8px';
//                 headerRow.appendChild(th);
//             });
//             thead.appendChild(headerRow);

//             const tbody = document.createElement('tbody');

//             lines.reverse().forEach(line => {

//                 const parts = line.split(',');
//                 // parts: [datetime, hole1, hole2, ..., hole9, player]
//                 const datetime = parts[0];
//                 const holes = parts.slice(1, 10);
//                 const player = parts[10];
//                 const total = holes.reduce((sum, h) => sum + parseInt(h), 0);

//                 // Reformat the date
//                 const [datePart] = datetime.split(' ');
//                 const [year, month, day] = datePart.split('-');
//                 const shortYear = year.slice(-2);
//                 const formattedDate = `${month}/${day}/${shortYear}`;

//                 const row = document.createElement('tr');

//                 // Holes cell
//                 const holesCell = document.createElement('td');
//                 holesCell.textContent = holes.join(' ');
//                 holesCell.style.padding = '8px';
//                 row.appendChild(holesCell);

//                 // Total cell
//                 const totalCell = document.createElement('td');
//                 totalCell.textContent = total;
//                 totalCell.style.padding = '8px';
//                 row.appendChild(totalCell);

//                 // Date cell
//                 const dateCell = document.createElement('td');
//                 dateCell.textContent = formattedDate;
//                 dateCell.style.padding = '8px';
//                 row.appendChild(dateCell);

//                 // Player cell
//                 const playerCell = document.createElement('td');
//                 playerCell.textContent = player;
//                 playerCell.style.padding = '8px';
//                 row.appendChild(playerCell);

//                 tbody.appendChild(row);
//             });

//             table.appendChild(thead);
//             table.appendChild(tbody);
//             recentScoresDiv.appendChild(table);
//         }



//         loadRecentScores();
//     }

//     // If we are on the data page
//     if (filterForm && averagesContainer) {
//         filterForm.addEventListener('submit', (e) => {
//             e.preventDefault();
//             const player = document.getElementById('filterPlayerName').value;
//             loadAverages(player);
//         });

//         clearFilterBtn.addEventListener('click', () => {
//             document.getElementById('filterPlayerName').value = '';
//             loadAverages();
//         });

//         async function loadAverages(player = '') {
//             const url = player ? `server.py?action=get_averages&player=${encodeURIComponent(player)}`
//                 : 'server.py?action=get_averages';
//             const response = await fetch(url);
//             const text = await response.text();
//             const lines = text.trim().split('\n').filter(line => line);

//             averagesContainer.innerHTML = '';
//             // lines should represent each hole's average as a single number
//             // If no data, show zeros
//             if (lines.length === 9) {
//                 lines.forEach((avg, i) => {
//                     const div = document.createElement('div');
//                     div.classList.add('hole-average');
//                     div.innerHTML = `<div>Hole ${i + 1}</div><div>${parseFloat(avg).toFixed(2)}</div>`;
//                     averagesContainer.appendChild(div);
//                 });
//             } else {
//                 // No data or invalid
//                 for (let i = 0; i < 9; i++) {
//                     const div = document.createElement('div');
//                     div.classList.add('hole-average');
//                     div.innerHTML = `<div>Hole ${i + 1}</div><div>0.00</div>`;
//                     averagesContainer.appendChild(div);
//                 }
//             }
//         }

//         loadAverages();
//     }

//     // Get all input elements and the course map image
//     const inputs = document.querySelectorAll('.holes-inputs input');
//     const courseMap = document.getElementById('courseMap');
//     const form = document.getElementById('scoreForm');

//     // Add event listeners for focus
//     inputs.forEach((input, index) => {
//         input.addEventListener('focus', () => {
//             // Change image source based on the input being focused
//             courseMap.src = `assets/${index + 1}.png`;
//         });
//     });

//     // Add global blur event for the form to reset to `assets/all.png` if no input is focused
//     form.addEventListener('focusout', (event) => {
//         // Check if none of the input boxes are focused
//         setTimeout(() => {
//             if (!document.activeElement.closest('.holes-inputs')) {
//                 courseMap.src = 'assets/all.png';
//             }
//         }, 0);
//     });

//     // Load the leaderboard
//     async function loadLeaderboard() {
//         const response = await fetch('server.py?action=get_leaderboard');
//         const text = await response.text();
//         const lines = text.trim().split('\n').filter(line => line);

//         const leaderboardDiv = document.getElementById('Leaderboard');
//         leaderboardDiv.innerHTML = '';

//         // Create table and table header
//         const table = document.createElement('table');
//         table.style.width = '100%';
//         table.style.borderCollapse = 'collapse';
//         const thead = document.createElement('thead');
//         const headerRow = document.createElement('tr');

//         // Define table headers
//         const headers = ['Holes', 'Total', 'Date', 'Player'];
//         headers.forEach(h => {
//             const th = document.createElement('th');
//             th.textContent = h;
//             th.style.textAlign = 'left';
//             th.style.borderBottom = '1px solid #ccc';
//             th.style.padding = '8px';
//             headerRow.appendChild(th);
//         });
//         thead.appendChild(headerRow);

//         const tbody = document.createElement('tbody');

//         lines.forEach((line, index) => {
//             const parts = line.split(',');
//             if (parts.length < 12) return;

//             const datetime = parts[0];
//             const holes = parts.slice(1, 10);
//             const total = parts[10];
//             const player = parts[11];

//             // Reformat the date
//             const [datePart] = datetime.split(' ');
//             const [year, month, day] = datePart.split('-');
//             const shortYear = year.slice(-2);
//             const formattedDate = `${month}/${day}/${shortYear}`;

//             const row = document.createElement('tr');

//             // Apply background color based on position
//             if (index === 0) {
//                 row.style.backgroundColor = '#FFF4CC'; // Darker light gold
//             } else if (index === 1) {
//                 row.style.backgroundColor = '#F0F0F0'; // Darker light silver
//             } else if (index === 2) {
//                 row.style.backgroundColor = '#F7E9E0'; // Darker light bronze
//             }

//             // Holes cell
//             const holesCell = document.createElement('td');
//             holesCell.textContent = holes.join(' ');
//             holesCell.style.padding = '8px';
//             row.appendChild(holesCell);

//             // Total cell
//             const totalCell = document.createElement('td');
//             totalCell.textContent = total;
//             totalCell.style.padding = '8px';
//             row.appendChild(totalCell);

//             // Date cell
//             const dateCell = document.createElement('td');
//             dateCell.textContent = formattedDate;
//             dateCell.style.padding = '8px';
//             row.appendChild(dateCell);

//             // Player cell
//             const playerCell = document.createElement('td');
//             playerCell.textContent = player;
//             playerCell.style.padding = '8px';
//             row.appendChild(playerCell);

//             tbody.appendChild(row);
//         });


//         table.appendChild(thead);
//         table.appendChild(tbody);
//         leaderboardDiv.appendChild(table);
//     }

//     // Call this function to load the leaderboard on page load
//     loadLeaderboard();

// });
