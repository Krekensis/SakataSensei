export const GET = async () => {
	const query = `
		query {
			Page(perPage: 20) {
				media(type: ANIME, sort: TRENDING_DESC) {
					id
					title {
						romaji
						english
					}
					coverImage {
						extraLarge
						color
					}
					format
					startDate {
						year
					}
					averageScore
					meanScore
					status
				}
			}
		}`;

	const res = await fetch("https://graphql.anilist.co", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ query }),
	});

	const data = await res.json();

	return new Response(JSON.stringify(data.data.Page.media), {
		headers: {
			"Content-Type": "application/json",
		},
	});
};