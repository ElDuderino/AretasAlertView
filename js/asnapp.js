const REQ_METHOD = location.protocol;
const APP_HOST = "localhost:8080/rest/";

const API_URL = `${REQ_METHOD}//${APP_HOST}`;

var appBearerToken = null;

/**
 * This is the main hook that checks for any 401 messages from the API and detects if the user is not logged in
 * We then launch the login modal that should be present on all pages
 */
$(document).ajaxError(function (event, jqxhr, settings, exception) {
    if (jqxhr.status == 401) {
        console.log("Looks like you are not logged into the API");
        //launch the login modal that logs us in and gets the bearer token
        doLogin();
    }
});

// Global fetch wrapper
async function globalFetch(url, options) {
    try {
        const response = await fetch(url, options);
        if (response.status === 401) {
            console.log("Looks like you are not logged into the API");
            doLogin();
        }
        return response; // Pass through the response for further handling
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        throw error;  // Re-throw the error for further handling if needed
    }
}

/**
 * This is the main app entry point and should be called on the DOMContentLoaded event
 * at the top of every page
 * @returns 
 */
async function app_init() {

    console.log("APP INIT");

    if ((typeof (localStorage.getItem('X-Bearer-Access-Token')) == "undefined") || (localStorage.getItem("X-Bearer-Access-Token") == null)) {

        //we don't need to do anything else since any API request will trigger a 401
        //the 401 will trigger the login form to show
        //the login form then refreshes the page and presumably the bearer token is set
        console.warn("Bearer token storage is not set");
        appBearerToken = null;

    } else {

        appBearerToken = localStorage.getItem('X-Bearer-Access-Token');
        console.log(`Bearer token: ${appBearerToken}`);

    }

    //this attempts to update the top nav with the active link by current page 
    //updateActiveNav();

    /**
     * Render the *included* html elements (login form, modals, etc)
     */
    await includeHtmlFetch();

    document.getElementById('loginForm').addEventListener('submit', login);

    const loginModal = new bootstrap.Modal('#modalLoginForm', {
        keyboard: false
    });

    /**
     * Allow someone to hit enter to login
     */
    $('#loginPassword').keypress(function (e) {
        if (e.which == 13) {
            login();
        }
    });

    /** make sure the login modal exists on all pages and/or was loaded by includeHtmlFetch()*/
    $('#btnLoginForm').click(function () {
        login();
    });

    /**
     * Make sure the nav contains a logout button
     */
    $('#logoutButton').click(function () {

        let token = localStorage.getItem("X-Bearer-Access-Token");

        console.log("Logged out");
        localStorage.removeItem("X-Bearer-Access-Token");
        localStorage.removeItem("X-Bearer-Refresh-Token");
        location.reload();
        
    });

}

/**
 * Show the login modal
 */
function doLogin() {
    console.debug("Showing login modal");
    /** make sure the login modal exists on all pages */
    const loginModal = new bootstrap.Modal(document.getElementById("modalLoginForm"));
    loginModal.show();
}

/**
 * Submit login info and get a token
 * @param {*} event 
 */
async function login(event) {

    event.preventDefault(); // Prevent the form from submitting the default way

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    const credentials = {
        username: username,
        password: password
    }

    const response = await globalFetch(`${API_URL}authentication/j`, {
        method: 'POST',
        body: JSON.stringify(credentials),
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (response.ok) {

        const token = await response.text();
        console.log(`Response:${token}`);

        // Store the token in localStorage or a cookie
        localStorage.setItem('X-Bearer-Access-Token', token);
        appBearerToken = token;

        console.info("Login successful!")
        location.reload();

        // Redirect or update the UI as needed
    } else {
        bootbox.alert('Login failed!');
    }
}


/**
 * Updated function to fetch html snippets and add them to the DOM
 * If you need recursion ability (i.e. your includes have includes)
 * then use the old includeHTML() function
 * (or we can add recursion to this one and test)
 */
async function includeHtmlFetch() {

    let elements = document.querySelectorAll('[w3-include-html]');

    for (const element of elements) {

        let filename = element.getAttribute("w3-include-html");

        try {
            const htmlData = await fetch(filename).then((response) => response.text());
            element.innerHTML = htmlData;

        } catch (error) {
            element.innerHTML = "element fragment not found.";
        } finally {
            element.removeAttribute("w3-include-html");
        }
    }
}

/**
 * Updates the nav bar html to highlight the right link based on what page the user is on
 */
function updateActiveNav() {

    //get the current html page
    const pathInfoArr = window.location.pathname.split("/");

    const page = pathInfoArr[pathInfoArr.length - 1];

    const querySelector = 'a[href=\"' + page + '\"]';
    const href = document.querySelectorAll(querySelector)[0];

    if (href) {

        const span = document.createElement("span");
        span.setAttribute("class", "sr-only");
        span.append("(current)");

        href.append(span);
        href.setAttribute("class", href.getAttribute("class") + " active");

        const parent = href.parentNode;
        parent.setAttribute("class", parent.getAttribute("class") + " active");

    }
}

/**
 * Show the loading spinner
 */
function showLoader() {
    document.getElementById('loader').style.visibility = 'visible';
}
/**
 * Hide the loading spinner
 */
function hideLoader() {
    document.getElementById('loader').style.visibility = 'hidden';
}