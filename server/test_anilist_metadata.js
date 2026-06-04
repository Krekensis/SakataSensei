import fetch from 'node-fetch';
import fs from 'fs';

const query = `
query ($idMal: Int) {
  Media(idMal: $idMal, type: ANIME) {
    id
    idMal
    title {
      romaji
      english
      native
    }
    description
    format
    status
    startDate { year month day }
    endDate { year month day }
    season
    seasonYear
    episodes
    duration
    countryOfOrigin
    isLicensed
    source
    trailer { id site thumbnail }
    coverImage { extraLarge large medium color }
    bannerImage
    genres
    synonyms
    averageScore
    meanScore
    popularity
    isAdult
    tags { name description category rank isMediaSpoiler isGeneralSpoiler }
    relations {
      edges {
        relationType
        node { id idMal type format title { romaji } }
      }
    }
    studios(isMain: true) { nodes { name } }
  }
}
`;

async function test() {
    try {
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                variables: { idMal: 16498 } // Attack on Titan
            })
        });

        const data = await response.json();
        fs.writeFileSync('./anilist-anime-fetch-sample.json', JSON.stringify(data, null, 2));
        console.log('Successfully saved to anilist-anime-fetch-sample.json');
    } catch (e) {
        console.error(e);
    }
}
test();
