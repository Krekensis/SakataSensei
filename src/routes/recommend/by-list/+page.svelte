<script lang="ts">
    import { onMount } from "svelte";
    import Navbar from "$lib/components/Navbar.svelte";
    

    let isLoaded = false;
    let isLoggedIn = false;

    function goTo(path: string) {
        window.location.href = path;
    }

    function connectAniList() {
        const clientId = import.meta.env.VITE_ANILIST_CLIENT_ID;
        const redirectUri = import.meta.env.VITE_ANILIST_REDIRECT_URI;
        const authUrl = `https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
        goTo(authUrl);
    }

    function generateCodeVerifier(length = 128): string {
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
        let verifier = "";
        for (let i = 0; i < length; i++) {
            verifier += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return verifier;
    }

    async function connectMyAnimeList() {
        const clientId = import.meta.env.VITE_MYANIMELIST_CLIENT_ID;
        const redirectUri = import.meta.env.VITE_MYANIMELIST_REDIRECT_URI;

        const codeVerifier = generateCodeVerifier();
        const codeChallenge = codeVerifier;
        
        sessionStorage.setItem("mal_code_verifier", codeVerifier);

        const authUrl = `https://myanimelist.net/v1/oauth2/authorize?` +
                        `response_type=code&` +
                        `client_id=${clientId}&` +
                        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                        `code_challenge=${codeChallenge}&` +
                        `code_challenge_method=plain`;

        goTo(authUrl);
    }

    function importLists() {
        // Placeholder for now
        alert("Importing lists...");
    }

    onMount(() => {
        setTimeout(() => {
            isLoaded = true;
        }, 50);

        isLoggedIn = Boolean(sessionStorage.getItem("anilist_token")) || Boolean(sessionStorage.getItem("mal_token"));
    });
</script>

<Navbar color="#a78bfa"/>

<section class="min-h-screen bg-gradient-to-br from-[#090311] to-[#141634] relative text-white overflow-hidden">
    <div class="relative z-10 flex flex-col-reverse lg:flex-row items-center justify-between px-6 sm:px-10 lg:px-27 pt-24 lg:pt-36 pb-5 gap-1">
        
        <div class="text-left w-full max-w-3xl {isLoaded ? 'animate-fade-in-top' : 'opacity-0'}">
            <h1 class="text-4xl sm:text-5xl font-extrabold leading-tight mb-6">
                <span class="text-purple-300 text-3xl sm:text-4xl font-black font-newtegomin">
                    Recommendation using your lists
                </span>
            </h1>

            <p class="text-white/70 text-lg sm:text-lg mb-6 font-mono leading-relaxed">
                Import your anime lists from AniList or MyAnimeList to receive personalized recommendations based on the genres you watch most, how you've rated them, and more. 
            </p>

            <!-- Login status -->
            {#if isLoggedIn}
                <div class="flex items-center mb-4 text-green-400 font-mono">
                    <!-- Checkmark Icon -->
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>You are already logged in</span>
                </div>
                <button on:click={importLists} class="px-4 py-2 bg-purple-400/30 hover:bg-purple-400/40 rounded-lg text-white flex items-center gap-2" >
                    <!-- Import Icon -->
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 15v2a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-2m-8 1V4m0 12-4-4m4 4 4-4"/>
                    </svg>
                    Import Lists
                </button>
            {:else}
                <div class="flex items-center mb-4 text-red-400 font-mono">
                    <!-- Cross Icon -->
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>You are not logged in</span>
                </div>
                <div class="flex flex-row gap-3">
                    <button on:click={connectAniList} class="px-4 py-1.5 bg-purple-400/30 hover:bg-purple-400/40 rounded-lg text-white font-mono flex items-center gap-2">
                        Connect with
                        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="w-4.5 h-4.5"><path d="M24 17.53v2.421c0 .71-.391 1.101-1.1 1.101h-5l-.057-.165L11.84 3.736c.106-.502.46-.788 1.053-.788h2.422c.71 0 1.1.391 1.1 1.1v12.38H22.9c.71 0 1.1.392 1.1 1.101zM11.034 2.947l6.337 18.104h-4.918l-1.052-3.131H6.019l-1.077 3.131H0L6.361 2.948h4.673zm-.66 10.96-1.69-5.014-1.541 5.015h3.23z"/></svg>
                    </button>
                    <button on:click={connectMyAnimeList} class="px-4 py-1.5 bg-purple-400/30 hover:bg-purple-400/40 rounded-lg text-white font-mono flex items-center gap-2">
                        Connect with
                        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="w-8 h-8"><path d="M8.45 15.91H6.067v-5.506h-.028l-1.833 2.454-1.796-2.454H2.39v5.507H0V6.808h2.263l1.943 2.671 1.98-2.671H8.45zm8.499 0h-2.384v-2.883H11.96c.008 1.011.373 1.989.914 2.884l-1.942 1.284c-.52-.793-1.415-2.458-1.415-4.527 0-1.015.211-2.942 1.638-4.37a4.809 4.809 0 0 1 2.737-1.37c.96-.15 1.936-.12 2.905-.12l.555 2.051H15.48c-.776 0-1.389.113-1.839.337-.637.32-1.009.622-1.447 1.78h2.372v-1.84h2.384zm3.922-2.05H24l-.555 2.05h-4.962V6.809h2.388z"/></svg>
                    </button>
                </div>
            {/if}
        </div>
        
        <!-- Image -->
        <div class="flex-shrink-0">
            <!-- Mobile image -->
            <img
                src="/img2.png"
                alt="img2"
                class="block lg:hidden w-[350px] sm:w-[350px] lg:w-[320px] h-auto drop-shadow-2xl rounded-lg {isLoaded ? 'animate-fade-in-top' : 'opacity-0'} mb-3"
            />

            <!-- Desktop image -->
            <img
                src="/img3.png"
                alt="img3"
                class="hidden lg:block w-[260px] sm:w-[300px] lg:w-[320px] h-auto drop-shadow-2xl rounded-lg {isLoaded ? 'animate-fade-in-bottom' : 'opacity-0'} ml-3"
            />
        </div>
    
    </div>
</section>

<style>
    @keyframes fade-in-bottom {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    @keyframes fade-in-top {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .animate-fade-in-top {
        animation: fade-in-top 500ms ease-out;
    }
    .animate-fade-in-bottom {
        animation: fade-in-bottom 500ms ease-out;
    }
</style>
