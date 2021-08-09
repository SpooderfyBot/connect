const RefUrl = "http://127.0.0.1:8000"
const LoginUrl = "http://127.0.0.1:8000/authorize"

PetiteVue.createApp({
    isStreaming: false,
    user: null,
    streamKey: null,
    buttonPending: false,
    counter: 25,

    allowControlsChecked: true,
    allowControls: true,

    isPublicChecked: false,
    isPublic: false,

    displayErr: null,

    get userImg() {
        if (this.user == null) {
            return null
        }

        return `https://cdn.discordapp.com/avatars/${this.user.id}/${this.user.avatar}.webp?size=128`
    },

    get page() {
        if (this.displayErr !== null) {
            console.log(this.displayErr);
            return -1
        }

        if (this.user == null) {
            return 1
        } else if (this.isStreaming) {
            return 3
        } else {
            return 2
        }
    },

    get streamKeyValid() {
        return !(
            (this.streamKey === null) || (this.streamKey === "")
        );
    },

    handleMeta(meta) {
        this.streamKey = meta.streamKey;
        this.isStreaming = meta.isStreaming;
        this.allowControls = meta.allowControls;
        this.allowControlsChecked = meta.allowControls;
    },

    async load() {
        try {
            console.debug("checking runtime");
            await browser.tabs.executeScript({file: "/content_scripts/checkValid.js"});
        } catch (e) {
            this.displayErr = "No video elements exist in this page.";
            return true;
        }

        await browser.tabs.executeScript({file: "/content_scripts/active.js"});
        console.log("injected active.js");

        const tabs = await browser.tabs
            .query({active: true, currentWindow: true});

        const meta = await browser.tabs.sendMessage(
            tabs[0].id,
            {
                "eventType": "getMeta",
            }
        );

        this.handleMeta(meta);

        let retrieved = await browser.storage.local.get("user");
        console.log("got retrieval", retrieved)
        this.user = retrieved.user;

        if (this.user != null) {
            let retrieved = localStorage.getItem("buttonPending");
            this.buttonPending = retrieved != null;
        }

        return true
    },

    async login() {
        localStorage.setItem("buttonPending", "true");
        this.buttonPending = true;

        let r = await axios.get(`${RefUrl}/identify`);
        let ref_id = r.data.id;

        browser.tabs.create(
            {
                url: `${LoginUrl}?ref=${ref_id}`
            }
        )

        let user = await browser.runtime.sendMessage(
            null,
            {
                "eventType": "pollLogin",
                "data": {
                    "ref": ref_id,
                    "refUrl": RefUrl,
                }
            },
        );

        localStorage.removeItem("buttonPending");
        this.user = user;
        await browser.storage.local.set({user: user, ref: ref_id});

        this.buttonPending = false;
    },

    async logout() {
        const retrieved = await browser.storage.local.get("ref");
        await axios.post(`${RefUrl}/revoke?ref=${retrieved.ref}`);

        await browser.storage.local.remove(["user", "ref"]);
        this.user = null;
    },

    async startStreaming() {
        if (!this.streamKeyValid) {
            return
        }

        this.buttonPending = true;
        const retrieved = await browser.storage.local.get("ref");

        const tabs = await browser.tabs.query({active: true, currentWindow: true});
        await browser.tabs.sendMessage(
            tabs[0].id,
            {
                "eventType": "startStreaming",
                "data": {
                    "streamKey": this.streamKey,
                    "ref": retrieved.ref,
                }
            }
        )

        this.buttonPending = false;
        this.isStreaming = true;
    },

    async stopStreaming() {
        this.buttonPending = true;

        const tabs = await browser.tabs.query({active: true, currentWindow: true});
        await browser.tabs.sendMessage(
            tabs[0].id,
            {
                "eventType": "stopStreaming",
            }
        )

        this.buttonPending = false;
        this.isStreaming = false;
    },

    async incRoomSize() {
        this.counter++
        await this.limitRoomSize()
    },

    async decRoomSize() {
        this.counter--
        await this.limitRoomSize()
    },

    async limitRoomSize() {
        console.log(this.counter);
    },

    async togglePublic() {
        this.isPublic = !this.isPublicChecked;
    },

    async toggleControls() {
        this.allowControls = !this.allowControlsChecked;

        const tabs = await browser.tabs.query({active: true, currentWindow: true});
        await browser.tabs.sendMessage(
            tabs[0].id,
            {
                "eventType": "toggleControls",
                "data": {
                    "allowControls": this.allowControls,
                }
            }
        )
    },
}).mount()
