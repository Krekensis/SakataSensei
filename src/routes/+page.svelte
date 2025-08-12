

<script lang="ts">
    import TrendingAnime from '$lib/components/TrendingAnime.svelte';
    import { onMount } from "svelte";
    
    let isLoaded = false;
    
    onMount(() => {
        setTimeout(() => {
            isLoaded = true;
        }, 50);
    });

    function goTo(path: string) {
        window.location.href = path;
    }
</script>

<section class="min-h-screen bg-gradient-to-br from-[#02020f] to-[#132d3f] relative text-white overflow-hidden">
    <div class="relative z-10 flex flex-col-reverse lg:flex-row items-center justify-between px-6 sm:px-10 lg:px-27 pt-24 lg:pt-36 pb-5 gap-1">
        <!-- Erm, idk rest of the shit-->
        <div class="text-left w-full max-w-3xl {isLoaded ? 'animate-fade-in-top' : 'opacity-0'}">
            <h1 class="text-4xl sm:text-5xl font-extrabold leading-tight mb-6">
                <span class="text-blue-400 text-5xl sm:text-6xl font-black font-newtegomin">Sakata Sensei,</span><br />
                <span class="text-white font-newtegomin">オススメはなんですか ??</span>
            </h1>

            <p class="text-white/70 text-lg sm:text-lg mb-6 font-mono leading-relaxed">
                Sometimes you just don't know what to watch. Get personalized anime recommendations
                from Sakata Sensei based on your watched list, find shows similar to your
                favorites, or explore using AI-powered chat queries.
            </p>
            <!-- types -->
            <div class="flex flex-wrap gap-3">

                <button on:click={() => goTo("/reccomend/by-list")} class="flex items-center gap-2 bg-blue-900/60 hover:bg-blue-800/60 font-mono px-3 py-1.5 rounded-xl shadow-lg transition" >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor" >
                        <path d="M3 6h2v2H3V6zm4 0h14v2H7V6zM3 11h2v2H3v-2zm4 0h14v2H7v-2zM3 16h2v2H3v-2zm4 0h14v2H7v-2z" />
                    </svg>
                    Your lists
                </button>

                <button on:click={() => goTo("/reccomend/by-anime")} class="flex items-center gap-2 bg-blue-900/60 hover:bg-blue-800/60 font-mono px-3 py-1.5 rounded-xl shadow-lg transition" >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 64 64" >
                        <circle cx="24" cy="32" r="18" fill="#60a5fa" fill-opacity="0.5" />
                        <circle cx="40" cy="32" r="18" fill="#60a5fa" fill-opacity="0.5" />
                    </svg>
                    Similar anime
                </button>

                <button on:click={() => goTo("/reccomend/by-chat")} class="flex items-center gap-2 bg-blue-900/60 hover:bg-blue-800/60 font-mono pr-3 pl-2.5 py-1.5 rounded-xl shadow-lg transition" >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 64 64" >
                        <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-size="40" fill="#60a5fa" font-weight="bold" font-family="sans-serif"> AI </text>
                    </svg>
                    Query based
                </button>
            </div>
        </div>
        
        <!-- Image -->
        <div class="flex-shrink-0">
            <!-- Mobile image (column layout) -->
            <img
                src="/img2.png"
                alt="img2"
                class="block lg:hidden w-[350px] sm:w-[350px] lg:w-[320px] h-auto drop-shadow-2xl rounded-lg {isLoaded ? 'animate-fade-in-top' : 'opacity-0'} mb-3"
            />

            <!-- Desktop image (row layout) -->
            <img
                src="/img1.png"
                alt="img1"
                class="hidden lg:block w-[260px] sm:w-[300px] lg:w-[320px] h-auto drop-shadow-2xl rounded-lg {isLoaded ? 'animate-fade-in-bottom' : 'opacity-0'} ml-3"
            />
        </div>
    
    </div>
    <!-- Trending Anime -->
    <div class="{isLoaded ? "animate-fade-in-bottom" : "opacity-0"} transition-all duration-500 mt-5 mb-10 px-6 sm:px-10 lg:px-27">
        <TrendingAnime />
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
