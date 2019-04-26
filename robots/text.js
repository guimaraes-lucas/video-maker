const algorithmia = require('algorithmia')
const algorithmiaApiKey = require('../credentials.json').apiKey
const sentenceBoundaryDetection = require('sbd')

async function robot(content) {
    await fetchContentFromWikipedia(content)
    sanizeContent(content)
    breakContentIntoSentences(content)

    async function fetchContentFromWikipedia(content) {
        const algorithmiaAutenticated = algorithmia(algorithmiaApiKey)
        const wikipediaAlgorithm = algorithmiaAutenticated.algo('web/WikipediaParser/0.1.2?timeout=300')
        try {
            const wikipediaResponde = await wikipediaAlgorithm.pipe(content.searchTerm)
            const wikipediaContent = wikipediaResponde.get()
            
            content.sourceContentOriginal = wikipediaContent.content
        } catch (e) {
            console.log(e); 
        }
    }
    
    function sanizeContent(content) {
        const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal)
        const withoutDatesInParentheses = removeDatesInParentheses(withoutBlankLinesAndMarkdown)
        
        content.sourceContentSanitized = withoutDatesInParentheses
        
        function removeBlankLinesAndMarkdown(text) {
            const allLines = text.split('\n')
            
            const withoutBlankLinesAndMarkdown = allLines.filter((line) => {
                if (line.trim().length === 0 || line.trim().startsWith('=')) {
                    return false
                }
                
                return true
            })
            
            return withoutBlankLinesAndMarkdown.join(' ')
        }
    }
    
    function removeDatesInParentheses(text) {
        return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g,' ')
    }
    
    function breakContentIntoSentences(content) {
        content.sentences = []
        
        const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)
        sentences.forEach((sentence) => {
            content.sentences.push({
                text: sentence,
                keywords: [],
                images: []
            })
        })
    }
}

module.exports = robot