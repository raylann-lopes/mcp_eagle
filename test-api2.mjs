import axios from 'axios';

const token = 'f94ada09-128d-4b9c-84e2-ba164159acd4';

async function testar() {
    try {
        const res = await axios.get('https://api.movidesk.com/public/v1/tickets', {
            params: {
                token,
                $filter: "clients/any(c: contains(c/businessName, 'ALMEIDA E ALMDEIA'))",
                $select: "id,subject,status,clients",
                $expand: "clients",
                $top: 5
            }
        });
        console.log("ALMEIDA E ALMDEIA (Escrito Errado - da print):", res.data.length);
        
        const res2 = await axios.get('https://api.movidesk.com/public/v1/tickets', {
            params: {
                token,
                $filter: "clients/any(c: contains(c/businessName, 'ALMEIDA E ALMEIDA'))",
                $select: "id,subject,status,clients",
                $expand: "clients",
                $top: 5
            }
        });
        console.log("ALMEIDA E ALMEIDA (Escrito Corretamente):", res2.data.length);
    } catch (e) {
        console.log("err:", e.response?.data?.message || JSON.stringify(e.response?.data) || e.message);
    }
}
testar();
