<script lang="ts">
    import { onMount } from 'svelte';
    import Cookies from 'js-cookie';
    
    function goTo(path: string) {
        window.location.href = path;
    }

    export let data: { token?: string; error?: string; details?: any };

    let isLoaded = false;
    let successMessage = '';

    onMount(() => {
        setTimeout(() => {
            isLoaded = true;
        }, 50);

        if (data.token) {
            successMessage = 'Successfully connected to AniList! Redirecting...';
            
            //cookie instead of sessionStorage
            Cookies.set('anilist_token', data.token, {
                
                expires: 7,
                secure: import.meta.env.VERSION_TYPE === "test" ? false : true,
                sameSite: 'Lax',
                path: '/'     
            });

            setTimeout(() => {
                goTo("/recommend/by-list");
            }, 1500);
        }
    });
</script>

<section class="min-h-screen bg-gradient-to-br from-[#02020f] to-[#132d3f] relative text-white overflow-hidden">
    <div class="relative z-10 flex flex-col-reverse lg:flex-row items-center justify-between px-6 sm:px-10 lg:px-27 pt-24 lg:pt-36 pb-5 gap-1">

        <div class="text-left w-full max-w-3xl">
            <h1 class="text-4xl sm:text-5xl font-extrabold leading-tight mb-6">
                <span class="text-blue-400 text-5xl sm:text-6xl font-black font-newtegomin">Authorization,</span><br />
            </h1>

            {#if data.error}
                <p class="text-red-400">Error: {data.error}</p>
                {#if data.details}
                    <pre>{JSON.stringify(data.details, null, 2)}</pre>
                {/if}
            {:else if successMessage}
                <p class="text-green-400 font-mono">{successMessage}</p>
            {:else}
                <p class="text-white/70 font-mono">Logging you in...</p>
            {/if}
        </div>
    </div>
</section>
