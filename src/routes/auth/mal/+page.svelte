<script lang="ts">
    import { onMount } from 'svelte';
    
    function goTo(path: string) {
        window.location.href = path;
    }

    export let data: { 
        token?: string; 
        refresh_token?: string;
        expires_in?: number;
        error?: string; 
        details?: any 
    };

    let isLoaded = false;
    let successMessage = '';

    onMount(() => {
        setTimeout(() => {
            isLoaded = true;
        }, 50);

        if (data.token) {
            successMessage = 'Successfully connected to MyAnimeList! Redirecting...';
            
            // Store tokens and expiry
            sessionStorage.setItem("mal_token", data.token);
            if (data.refresh_token) {
                sessionStorage.setItem("mal_refresh_token", data.refresh_token);
            }
            if (data.expires_in) {
                const expiryTime = Date.now() + (data.expires_in * 1000);
                sessionStorage.setItem("mal_token_expiry", expiryTime.toString());
            }

            // Clear the code verifier as it's no longer needed
            sessionStorage.removeItem("mal_code_verifier");

            // Redirect after showing success message
            setTimeout(() => {
                goTo("/recommend/by-list");
            }, 1500);
        }
    });

    function goBack() {
        goTo("/recommend/by-list");
    }
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