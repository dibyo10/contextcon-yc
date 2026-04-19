import emailStyles from '../constants/emailStyles.js'

function pickStyle(index) {
    return {
        hook: emailStyles.hook[index % 3],
        proof: emailStyles.proof[index % 3],
        ask: emailStyles.ask[index % 3],
    };
}

export default pickStyle;
