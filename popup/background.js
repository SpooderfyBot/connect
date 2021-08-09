(function () {
    if (window.ranOnce) {
        console.log("system background task already registered, ignoring...");
        return
    }
    window.ranOnce = true;


    let timeoutHandle = null;
    let attempt = 1;

    function checkLogin(detail) {
        fetch(`${detail.data.refUrl}/identify?ref=${detail.data.ref}`)
            .then((r) => {
                if (r.status === 200) {
                    r.json().then((data) => {
                        if (data.user != null) {
                            detail.respond(data.user);
                        }
                    });
                }

                if (attempt >= 10) {
                    detail.respond(null);
                    return
                }

                attempt++;

                // re-schedule to call 2s later
                timeoutHandle = setTimeout(
                    checkLogin,
                    2000,
                    detail,
                );
            })
    }

    window.addEventListener('pollLogin', (event) => {
        console.debug("pollLogin", event.detail);

        if (timeoutHandle !== null) {
            clearTimeout(timeoutHandle);
        }

        console.debug("checking user")
        checkLogin(event.detail);
        attempt = 1;
    });

    function handleMessage(request, _sender, sendResponse) {
        console.debug(request);

        const event = new CustomEvent(request.eventType, {
            detail: {
                respond: sendResponse,
                data: request.data,
            },
        })

        window.dispatchEvent(event);
        return true;
    }

    browser.runtime.onMessage.addListener(handleMessage);
})();