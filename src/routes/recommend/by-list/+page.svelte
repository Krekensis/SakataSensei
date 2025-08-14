<script lang="ts">
    import { onMount } from "svelte";
    import SVG from "$lib/components/SVG.svelte";
    import Navbar from "$lib/components/Navbar.svelte";
    import { importAnimeList } from '$lib/utils/importAnimeList';
    import { OAuth } from "$lib/utils/OAuth";
    import Cookies from "js-cookie";

    let isLoaded = false;
    let isLoggedIn = false;
    let loginType = "none";

    function handleListImport() {
        const accessToken = Cookies.get("anilist_token") || Cookies.get("mal_token") 
        if (!accessToken) {
            alert("You need to be logged in to import your anime list.");
            return;
        }

        importAnimeList(loginType, accessToken)
            .then(data => {
                console.log("Anime list imported successfully:", JSON.stringify(data));
                alert("Anime list imported successfully!");
            })
            .catch(error => {
                console.error("Error importing anime list:", error);
                alert("Failed to import anime list. Please try again.");
            });
    }

    function Logout(){
        Cookies.remove("anilist_token");
        Cookies.remove("mal_token");
        isLoggedIn = false;
        loginType = "none";
    }

    onMount(async () => {

        let isAnilist = Boolean(Cookies.get("anilist_token"));
        let isMyAnimeList = Boolean(Cookies.get("mal_token"));

        isLoggedIn = isAnilist || isMyAnimeList;
        loginType = isAnilist ? "AniList" : isMyAnimeList ? "MyAnimeList" : "none";

        const imagesToLoad = Array.from(document.images)
            .filter(img => !img.complete)
            .map(img => new Promise(resolve => {
                img.onload = img.onerror = resolve;
            }));

        await Promise.all(imagesToLoad);

        await new Promise(r => setTimeout(r, 100));

        isLoaded = true;
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
                <div class="flex items-center mb-4 text-green-400 font-mono gap-2">
                <!-- Checkmark Icon -->
                    <SVG name="checkmark" size="w-5 h-5" />
                    
                    <span>You are already logged in via</span>

                    {#if loginType === "AniList"}
                        <SVG name="anilist" size="w-4.5 h-4.5" />
                    {:else if loginType === "MyAnimeList"}
                        <SVG name="mal" size="w-8 h-8" />
                    {/if}
                </div>
                <div class="flex flex-row gap-3">
                    <button on:click={handleListImport} class="px-4 py-[8.5px] bg-purple-400/30 hover:bg-purple-400/40 rounded-lg text-white font-mono flex items-center gap-2" >
                        <!-- Import Icon -->
                        <SVG name="import" size="w-5 h-5" />
                        Import Lists
                    </button>
                    <button on:click={Logout} class="px-4 py-[8.5px] bg-purple-400/30 hover:bg-purple-400/40 rounded-lg text-white font-mono flex items-center gap-2" >
                        <SVG name="logout" size="w-5 h-5" />
                        Logout
                    </button>
                </div>
            {:else}
                <div class="flex items-center mb-4 text-red-400 font-mono">
                    <!-- Cross Icon -->
                    <SVG name="cross" size="w-5 h-5" />
                    <span class="ml-2">You are not logged in</span>
                </div>
                <div class="flex flex-row gap-3">
                    <button on:click={() => OAuth("AniList")} class="px-4 py-[5px] bg-purple-400/30 hover:bg-purple-400/40 rounded-lg text-white font-mono flex items-center gap-2">
                        Connect with
                        <SVG name="anilist" size="w-4.5 h-4.5" />
                    </button>
                    <button on:click={() => OAuth("MyAnimeList")} class="px-4 py-[5px] bg-purple-400/30 hover:bg-purple-400/40 rounded-lg text-white font-mono flex items-center gap-2">
                        Connect with
                        <SVG name="mal" size="w-8 h-8" />
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
