import axios from 'axios';

const token = 'f94ada09-128d-4b9c-84e2-ba164159acd4';

async function testar() {
    try {
        const res = await axios.get('https://api.movidesk.com/public/v1/persons', {
            params: {
                token,
                $filter: "contains(businessName, 'almeida')",
                $top: 5
            }
        });
        console.log("lowercase almeida sem tolower:", res.data.length);
    } catch (e) {
        console.log("err:", e.message);
    }
}
testar();
