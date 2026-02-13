const lawName = document.getElementById('law-list')
const articleInput = document.getElementById('article')
const paragraphInput = document.getElementById('paragraph')
const itemInput = document.getElementById('item')
const keywordsInput = document.getElementById('keywords')
const lawList = document.getElementById('law-list')
const errorDiv = document.getElementById('error')
const searchBtn = document.getElementById('search-btn')
const result = document.getElementById('result')
const history = document.getElementById('history')

document.addEventListener('DOMContentLoaded',()=>{
    //load()
    searchBtn.addEventListener('click', search)
})

function load(){
    //法令名、履歴の表示
}

async function searchFromInput(){
    errorDiv.classList.add('hidden')
    const errorList = []

    const lawNameStr = lawName.value
    const articleNum = articleInput.value
    const paragraphNum = paragraphInput.value
    const itemNum = itemInput.value
    let keywordsStr = keywordsInput.value
    
    if(!articleNum){
        errorList.push('条番号は必須です。')
        errorDisplay(errorList)
        return
    }

    // keywordsを配列に変換
    keywordsStr = keywordsStr.replaceAll('　',' ')
    keywordsStr = keywordsStr.replaceAll(',',' ')
    keywordsStr = keywordsStr.replaceAll('、',' ')

    const rawKeywords = keywordsStr.split(' ')
    const keywords = rawKeywords.filter(keyword => keyword !== '')

    // サーバーリクエスト
    const request = {
        action:'search-from-input',
        lawNameStr:lawNameStr,
        articleNum:articleNum,
        paragraphNum:paragraphNum,
        itemNum:itemNum,
        keywords:keywords
    }

    const resultData = await postServer(request)

    resultDisplay(resultData)
}

function resultDisplay(resultData){
    
}

function postServer(request){

}



function errorDisplay(errorList){
    const errStr = errorList.join('¥n')
    errorDiv.textContent = errStr
    errorDiv.classList.remove('hidden')
}

/*{'status':'error','errorMsg':'error message'}
{status:'success',ReArticleNums: [],ReParagraphNums: [], ReItemNums: [], contents: []}

*/