(function () {
    console.log("injecting script...");

    if (window.ranOnce) {
        console.log("system already registered, ignoring...");
        return
    }
    window.ranOnce = true;
    console.log("system preparing to be initialised");

    const servers = {
        iceServers: [
            {
                urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
            }
        ],
        iceCandidatePoolSize: 10,
    };

    let localStream = null;
    let metaData = {
        streamKey: null,
        isStreaming: false,
        allowControls: true,
    }

    async function startStreaming() {
        console.info("beginning rtc handshake...");
        let pc = new RTCPeerConnection(servers);

        localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: false});

        metaData.isStreaming = true;
    }

    async function stopStreaming() {
        console.info("beginning rtc shutdown...");

        if (localStream !== null) {
            localStream = null;
        }

        metaData.isStreaming = false;
    }

    window.addEventListener('startStreaming', (event) => {
        console.debug("startStreaming", event.detail);
        startStreaming().then(() => event.detail.respond({}));
    })

    window.addEventListener('stopStreaming', (event) => {
        console.debug("stopStreaming", event.detail);
        stopStreaming().then(() => event.detail.respond({}));
    })

    window.addEventListener('toggleControls', (event) => {
        console.debug("toggleControls", event.detail);
        metaData.allowControls = event.detail.allowControls;
        event.detail.respond({});
    })

    window.addEventListener('getMeta', (event) => {
        console.debug("getMeta", event.detail);

        event.detail.respond(metaData);
    })

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
