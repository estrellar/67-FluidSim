import {ref} from 'vue';
export interface Score { 
    name: string;
    score: number;
    date: string;
};

const switchCount = ref(0);
const gameState = ref<"idle" | "running" | "recordScore" | "scores"> ("idle");
const timeLeft = ref(30);

export function useGame(){
    function startGame(){
        switchCount.value = 0;
        timeLeft.value = 30;
        gameState.value = 'running'
        const interval = setInterval(() => {
            if(--timeLeft.value <= 0){
                clearInterval(interval);
                gameState.value = 'recordScore';
            }
        }, 1000);

    }

    function loadScores(): Score[] {
        return JSON.parse(localStorage.getItem('67-scores') ?? '[]');
    }

    function saveScore(name: string, score: number){
        //load and add new score
        const scores = loadScores();
        scores.push({name, score, date: new Date().toLocaleDateString()});
        //store last 10 sorted scores
        scores.sort((a:Score, b:Score) => b.score - a.score);
        localStorage.setItem('67-scores', JSON.stringify(scores.slice(0, 10)));
    }

    return {
        gameState,
        switchCount,
        timeLeft,
        startGame,
        loadScores,
        saveScore
    };
}