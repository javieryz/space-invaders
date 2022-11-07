window.onload = () => {
    if (window.location.href.match('home.html')) {
        loadHome();
    } else if (window.location.href.match('register.html')) {
        loadSignUp();
    } else if (window.location.href.match('login.html')) {
        loadLogIn();
    } else if (window.location.href.match('preferences.html')) {
        loadPreferences();
    } else if (window.location.href.match('scores.html')) {
        loadScores();
    } else if (window.location.href.match('play.html')) {
        loadPlay();
    }
}

function loadHome() {
    setInterval(() => {
        $('#home-text-play').fadeOut(800);
        $('#home-text-play').fadeIn(800);
    }, 2000);
}

function loadSignUp() {
    document.getElementById('signup-form').addEventListener('submit', event => {
        event.preventDefault();
        validateSignUp();
    });

    function validateSignUp() {
        if (!validateEmail()) {
            alert('Email address format incorrect. Please try again.');
        }
        if (!validatePasswords()) {
            if (validateEmail()) {
                alert('Passwords do not match. Please try again.');
            }
        }
    }

    function validateEmail() {
        const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;
        const emailAddress = document.getElementById('signup-email-input').value;

        return emailAddress.match(regex);
    }

    function validatePasswords() {
        const password = document.getElementById('signup-password-input').value;
        const confirmPassword = document.getElementById('signup-confirm-password-input').value;

        return password == confirmPassword;
    }
}

function loadLogIn() {
    document.getElementById('login-form').addEventListener('submit', event => {
        event.preventDefault();
        getAuthToken();
    })
    

    async function getAuthToken() {
        let url = 'http://wd.etsisi.upm.es:10000';
        let username = document.getElementById('login-email-input').value;
        let password = document.getElementById('login-password-input').value;
        let response = await fetch(url + `/users/login?username=${username}&password=${password}`);

        if (response.ok) {
            let bearer = await response.json();
            let authToken = bearer.split(' ')[1];
            localStorage.setItem('authToken', authToken);
        } else {
            alert('An error has ocurred. No token has been received.');
        }
    }
}

function loadPreferences() {
    document.getElementById('prefs-form').addEventListener('submit', event => {
        event.preventDefault();
        let ufoSelect = document.getElementById('prefs-ufos-select');
        let ufoValue = ufoSelect.value;
        let timeSelect = document.getElementById('prefs-time-select');
        let timeValue = timeSelect.value;

        document.getElementById('prefs-submit').blur();

        localStorage.setItem('ufo', ufoValue);
        localStorage.setItem('time', timeValue);

        let changesSaved = document.createElement('p');
        changesSaved.innerText = "CHANGES SAVED";
        changesSaved.style.textAlign = "center";
        document.getElementById('prefs-container').append(changesSaved);
    });
}

function loadScores() {
    let tableBody = document.getElementById('scores-table-body');
    const url = 'http://wd.etsisi.upm.es:10000';

    if (!tableBody.hasChildNodes()) {
        showScores();
    } 

    async function showScores() {
        let response = await fetch(url + '/records');
        if (response.ok) {
            let table = document.getElementById('scores-table-body');
            let scores = await response.json();
            let position = 1;

            for (let score of scores) {
                let row = document.createElement('tr');
                let positionCell = document.createElement('td');
                let positionData = document.createElement('p');
                positionCell.classList.add('page-table-td');
                positionData.classList.add('page-table-data');

                positionData.innerText = position;
                positionCell.append(positionData);
                row.append(positionCell);

                for (let data in score) {
                    if (data == 'disposedTime') continue;
                    let tableCell = document.createElement('td');
                    let tableData = document.createElement('p');
                    tableCell.classList.add('page-table-td');
                    tableData.classList.add('page-table-data');

                    if (data == 'recordDate') {
                        tableData.innerText = new Date(score[data]).toLocaleDateString();
                    } else {
                        tableData.innerText = score[data];
                    }

                    tableCell.append(tableData);
                    row.append(tableCell);
                }

                table.append(row);
                position++;
            }
        } else {
            alert('HTTP Error ' + response.status);
        }
    }
}

function loadPlay() {
    if (localStorage.getItem('ufo') == 0) {
        localStorage.setItem('ufo', 5);
    }
    if (localStorage.getItem('time') == 0) {
        localStorage.setItem('time', 60);
    }

    document.getElementById('score').innerText = 0;

    createUFOs();
    initializeTimer();

    /* Missile Controls */
    $(document).on('keydown', moveMissile);
    $(document).on('keydown', launchMissile);
    $(document).on('keyup', ignoreSpacebarHeld);

    function moveMissile(event) {
        let x = $("#missile").css("left").slice(0, -2);
        let pageWidth = window.screen.width - 80;

        if (x > 10) {
            if (event.key == 'ArrowLeft' || event.key == 'Left') {
                $("#missile").animate({
                    left: '-=40'
                }, 10, "linear");
            }
        }
        
        if (x < pageWidth) {
            if (event.key == 'ArrowRight' || event.key == 'Right') {
                $("#missile").animate({
                    left: '+=40'
                }, 10, "linear");
            }
        }

    }

    let hit = false;
    let down = false;
    let launching = false;

    function launchMissile(event) { 
        if (down) return;
        if (launching) return;
        if (event.key == ' ' || event.key == 'Spacebar') {
            launching = true;
            document.removeEventListener('keydown', launchMissile);
            document.removeEventListener('keydown', moveMissile);
            down = true;
        
            $("#missile").animate({
                top: "100px",
            }, {
                duration: 1000,
                easing: "linear",
                step: function() {
                    if (hitUFO($("#missile").position())) {
                        hit = true;
                        $("#missile").css("visibility", "hidden");
                        
                    }
                },
                complete: () => {
                    $("#missile").stop();
                    $("#missile").css("top", "1100px");
                    $("#missile").css("visibility", "visible");
                    if (hit) {
                        updatePoints(100);
                    } else {
                        updatePoints(-25);
                    }
                    hit = false;
                    launching = false;
                    document.addEventListener('keydown', moveMissile);
                    document.addEventListener('keydown', launchMissile);
                }
            });      
        }
    }

    function ignoreSpacebarHeld() {
        down = false;
    }

    function hitUFO(missilePosition) {
        let missileSize = { 
            height: $("#missile").height(), 
            width: $("#missile").width()
        }
        let ufoSize = {
            height: $("#ufo-hidden").height(),
            width: $("#ufo-hidden").width()
        }

        for (let ufo of $("#play-container").find(".ufo")) {
            let ufoPosition = ufo.getBoundingClientRect();

            if (((missilePosition.left + missileSize.width)  > ufoPosition.left) &&
                ((missilePosition.top  + missileSize.height) > ufoPosition.top)  &&
                ((ufoPosition.left + ufoSize.width)  > missilePosition.left) &&
                ((ufoPosition.top  + ufoSize.height) > missilePosition.top))
                return true;
        }
        
        return false;
    }

    /* Score and Time */
    let points = 0;

    function initializeTimer() {
        let timeLeft = localStorage.getItem('time');
        let counter = document.getElementById('time-left');
        counter.innerText = timeLeft;

        let countdown = setInterval(() => {
            if (Number(counter.innerText) == 0) {
                clearInterval(countdown);
                
                let numOfUFOs = localStorage.getItem('ufo');
                let timeSelected = localStorage.getItem('time');
                let finalScore = points;
                
                if (timeSelected == 120) {
                    finalScore = points/2;
                } else if (timeSelected == 180) {
                    finalScore = points/3;
                }

                numOfUFOs -= 1;
                finalScore = Math.max(0, finalScore - numOfUFOs*50);
                document.getElementById('score').innerText = Math.trunc(finalScore);
                document.getElementById('time-left').innerText = 0;
                $(document).off('keydown', moveMissile);
                $(document).off('keydown', launchMissile);
                moveFinalScore();
                

            } else {
                counter.innerText = counter.innerText - 1;
            }
        }, 1000);
    }

    function moveFinalScore() {
        $("#score-banner").fadeOut(1000, () => {
            $("#missile").remove();
        });

        $("#missile").fadeOut(100, () => {
            $("#score-banner").html("FINAL SCORE").fadeIn(1000);
        });
        
        $("#play-score").animate({
            left: $(window).width() / 2 - $("#play-score").width(),
            backgroundColor: '#1cc9be'
        }, 1200);
    }

    function updatePoints(value) {
        let pointsCounter = document.getElementById('score');
        points += value;
        pointsCounter.innerText = points;
    }

    /* UFO Creation */
    function createUFOs() {
        let numberOfUFOs = localStorage.getItem('ufo');
        let ufoTop = 30;

        for (let ufo of $("#play-container").find(".ufo")) {
            ufo.remove();
        }
        
        for (let i = 0; i < numberOfUFOs; i++) {
            createUFO(i, ufoTop);
            ufoTop += 80;
        }
    }

    function createUFO(i, ufoTop) {
        let ufo = document.createElement('img');
        let way = Math.round(Math.random());
        ufo.src = '/images/ufo.png';
        ufo.id = `ufo${i + 1}`;
        ufo.classList.add('ufo');
        ufo.style.top = ufoTop + 80 + 'px';
        ufo.style.left = window.screen.width * Math.random() + 'px';
        
        if (way == 0) {
            ufo.classList.add('toLeft');
        } else {
            ufo.classList.add('toRight');
        }

        $("#play-container").append(ufo);

        setInterval(() => {
            if (ufo.style.left.slice(0, -2) <= 8) {
                ufo.classList.remove('toLeft');
                ufo.classList.add('toRight');
            }
            if (ufo.style.left.slice(0, -2) >= window.screen.width - 60) {
                ufo.classList.remove('toRight');
                ufo.classList.add('toLeft');
            }

            if (ufo.classList.contains('toLeft')) {
                ufo.style.left = Number(ufo.style.left.slice(0, -2)) - 2 + 'px';
            }
            if (ufo.classList.contains('toRight')) {
                ufo.style.left = Number(ufo.style.left.slice(0, -2)) + 2 + 'px';
            }
        }, 10);
    }
}