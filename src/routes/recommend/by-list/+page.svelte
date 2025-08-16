<script lang="ts">
    import { onMount } from "svelte";
    import SVG from "$lib/components/SVG.svelte";
    import Navbar from "$lib/components/Navbar.svelte";
    import { importAnimeList } from '$lib/utils/importAnimeList';
    import { OAuth } from "$lib/utils/OAuth";

    let isLoaded = false;
    let isLoggedIn = false;
    let loginType = "none";
    let accessToken = "";

    let isImporting = false;
    let importSuccess = false;
    let importError = "";          
    let importedData: any = null;

    async function handleListImport() {
        if (!isLoggedIn) {
            importError = "You need to be logged in to import your anime list.";
            return;
        }

        isImporting = true;
        importError = "";
        importSuccess = false;

        try {
            const data = await importAnimeList(loginType, accessToken);
            importedData = data;
            importSuccess = true;
        } catch (error) {
            console.error("Error importing anime list:", error);
            importError = "Failed to import anime list. Please try again.";
        } finally {
            isImporting = false;
        }
    }

    async function logout() {
        await fetch('/auth/logout', { method: 'POST' });
        isLoggedIn = false;
        loginType = 'none';
        importSuccess = false;
        importedData = null;
    }

    function syntaxHighlightJson(json: string): string {
  if (!json) return "";

  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match: string): string => {
      let cls = "text-white"; // default

      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "text-yellow-400"; // key
        } else {
          cls = "text-green-400"; // string
        }
      } else if (/true|false/.test(match)) {
        cls = "text-blue-400"; // booleans
      } else if (/null/.test(match)) {
        cls = "text-gray-400"; // null
      } else {
        cls = "text-purple-400"; // numbers
      }

      return `<span class="${cls}">${match}</span>`;
    }
  );
}
    onMount(async () => {
        const status = await fetch('/auth/status', { credentials: 'include' });
        const { isLoggedIn: logged, accessToken: token, loginType: type } = await status.json();

        isLoggedIn = logged;
        loginType = type;
        accessToken = token || "";

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

<section class="bg-transparent relative text-white overflow-hidden">
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
                    {#if !importSuccess}
                        <button 
                            on:click={handleListImport} 
                            class="px-4 py-[8.5px] bg-purple-400/30 hover:bg-purple-400/40 rounded-lg text-white font-mono flex items-center gap-2"
                            disabled={isImporting}
                        >
                            {#if isImporting}
                                <SVG name="loader" size="w-5 h-5" className="animate-spin" />
                                Importing...
                            {:else}
                                <SVG name="import" size="w-5 h-5" />
                                Import Lists
                            {/if}
                        </button>
                    {:else}
                        <button class="px-4 py-[8.5px] bg-green-400/30 hover:bg-green-400/40 rounded-lg text-white font-mono flex items-center gap-2">
                            <SVG name="star" size="w-5 h-5" />
                            Recommend
                        </button>
                    {/if}
                    <button on:click={logout} class="px-4 py-[8.5px] bg-purple-400/30 hover:bg-purple-400/40 rounded-lg text-white font-mono flex items-center gap-2" >
                        <SVG name="logout" size="w-5 h-5" />
                        Logout
                    </button>
                </div>
                {#if importError}
                    <p class="mt-3 text-red-400 font-mono">{importError}</p>
                {/if}
                {#if importSuccess && importedData}
                    <div class="mt-3 p-3 bg-white/10 rounded-lg font-mono text-sm max-h-150 overflow-y-auto text-white overflow-x-auto">
                        <p class="mb-2 text-green-400">Imported Lists:</p>
                        <p class="mb-2 text-green-400"> - Anime completed: {importedData.completed.length}</p>
                        <p class="mb-2 text-green-400"> - Anime watching: {importedData.current.length}</p>
                        <p class="mb-2 text-green-400"> - Anime planned: {importedData.planning.length}</p>
                        <pre class="whitespace-pre-wrap break-all">{@html syntaxHighlightJson(JSON.stringify(importedData, null, 2))}</pre>
                    </div>
                {/if}
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
        
        {#if !importSuccess && !importedData}
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
        {/if}
    
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
