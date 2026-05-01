
const orderBtn = document.getElementById('orderBtn');
const menuBtn = document.getElementById('menuBtn');
const aboutBtn = document.getElementById('aboutBtn');
const staffBtn = document.getElementById('staffBtn');

orderBtn.addEventListener('click', function() {
    alert('About to jump to the ordering page！');
});

aboutBtn.addEventListener('click', function() {
    alert('About Us: Coffee hub Story');
});
staffBtn.addEventListener('click', function() {
    alert('Employee Login Portal');
});