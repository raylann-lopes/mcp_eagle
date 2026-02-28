import axios from 'axios';

const token = 'f94ada09-128d-4b9c-84e2-ba164159acd4';

async function testar() {
    try {
        const res = await axios.get('https://api.movidesk.com/public/v1/persons', {
            params: {
                token,
                $filter: "contains(tolower(businessName), tolower('ALMEIDA'))",
                $top: 5
            }
        });
        console.log("ALMEIDA normal:", res.data.length);
    } catch (e) {
        console.log("ALMEIDA normal err:", e.response?.data?.message || e.message);
    }
}
testar();
