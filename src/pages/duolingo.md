---
title: "Duolingo"
date: 2024-09-22
layout: layouts/base.njk
templateEngineOverride: njk,md
---

[Join me on Duolingo](https://www.duolingo.com/profile/SiJobling?via=share_profile_qr) where I’m continuing to regularly learn French. Follow me with the QR code below.

[![](images/Duolingo_Sharing-782x1024.png)](https://www.duolingo.com/profile/SiJobling?via=share_profile_qr)

<h2>Progress Dashboard</h2>

<div>
  <canvas id="progressChart"></canvas>
</div>

<h3>History</h3>
<table id="dataTable">
    <thead>
        <tr>
            <th>Date</th>
            <th>Streak</th>
            <th>Accuracy</th>
            <th>Words</th>
            <th>Position</th>
        </tr>
    </thead>
    <tbody>
        <tr><td colspan="5">Loading data...</td></tr>
    </tbody>
</table>

<details>
<summary>Add New Record</summary>
<form id="addRecordForm" style="margin-top: 1em; padding: 1em; border: 1px solid #ccc;">
    <label>
        Date: <input type="date" name="date" required>
    </label><br>
    <label>
        Streak: <input type="number" name="streak_count" required>
    </label><br>
    <label>
        Accuracy (%): <input type="number" name="accuracy_percentage" required>
    </label><br>
    <label>
        Words Learned: <input type="text" name="words_learned">
    </label><br>
    <label>
        Leaderboard Position: <input type="number" name="leaderboard_position">
    </label><br>
    <button type="submit">Add Record</button>
</form>
</details>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
    const API_URL = '/api/duolingo';

    async function fetchData() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Failed to fetch data');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching data:', error);
            document.querySelector('#dataTable tbody').innerHTML = '<tr><td colspan="5">Error loading data. Ensure NETLIFY_DATABASE_URL is set.</td></tr>';
            return null; // Return null to indicate error
        }
    }

    function renderTable(data) {
        if (data === null) return; // Do not render if there was an error

        const tbody = document.querySelector('#dataTable tbody');
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No data available.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(row => `
            <tr>
                <td>${new Date(row.date).toLocaleDateString()}</td>
                <td>${row.streak_count}</td>
                <td>${row.accuracy_percentage}%</td>
                <td>${row.words_learned || '-'}</td>
                <td>${row.leaderboard_position || '-'}</td>
            </tr>
        `).join('');
    }

    function renderChart(data) {
        if (data === null) return;

        const ctx = document.getElementById('progressChart').getContext('2d');

        // Sort by date ascending for chart
        const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

        const labels = sortedData.map(d => new Date(d.date).toLocaleDateString());
        const accuracyData = sortedData.map(d => d.accuracy_percentage);

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Accuracy (%)',
                    data: accuracyData,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    // Form submission
    document.getElementById('addRecordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = {
            date: formData.get('date'),
            streak_count: parseInt(formData.get('streak_count')),
            accuracy_percentage: parseInt(formData.get('accuracy_percentage')),
            words_learned: formData.get('words_learned'),
            leaderboard_position: formData.get('leaderboard_position') ? parseInt(formData.get('leaderboard_position')) : null
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                alert('Record added!');
                location.reload();
            } else {
                alert('Failed to add record');
            }
        } catch (error) {
            console.error('Error adding record:', error);
            alert('Error adding record');
        }
    });

    // Init
    (async () => {
        const data = await fetchData();
        renderTable(data);
        if (data && data.length > 0) {
            renderChart(data);
        }
    })();
</script>

<style>
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1em;
  }
  th, td {
    padding: 0.5em;
    border: 1px solid #ddd;
    text-align: left;
  }
  th {
    background-color: #f4f4f4;
  }
</style>
