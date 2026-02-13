const lawNameSelect = document.getElementById('law-list')
const articleInput = document.getElementById('article')
const paragraphInput = document.getElementById('paragraph')
const itemInput = document.getElementById('item')
const keywordsInput = document.getElementById('keywords')
const lawList = document.getElementById('law-list')
const errorDiv = document.getElementById('error')
const searchBtn = document.getElementById('search-btn')
const result = document.getElementById('result')
const template = document.getElementById('template')
const templateHistory = document.getElementById('template-history')
const history = document.getElementById('history')

document.addEventListener('DOMContentLoaded',()=>{
    load()
    
    history.addEventListener('click', e => {
        if(e.target && (e.target.classList.contains('meta') || e.target.classList.contains('content'))){
            const id = e.target.parentElement.getAttribute('data-id')
            searchFromHistory(id)
        }
    })
    
    searchBtn.addEventListener('click', searchFromInput)
    
    result.addEventListener('click', e => {
        if(e.target.classList.contains('save')){
            const resultData = JSON.parse(e.target.parentElement.getAttribute('data-save'))
            saveCache(resultData)
        }
    })
})

async function load(){
    try{
        //初期化
        lawNameSelect.innerHTML = ''
        history.innerHTML = '<summary>履歴</summary>'

        //法令名の表示
        const resultData = await postServer({action:'load'})
        const lawNameList = resultData.law_name_list

        lawNameList.forEach(law_name=>{
            const newOption = document.createElement('option')
            newOption.textContent = law_name
            lawNameSelect.appendChild(newOption)
        })

        //履歴の表示
        const wholeData = JSON.parse(localStorage.getItem('law_data'))
        if(!wholeData){
            return
        }
        wholeData.data.forEach(val => {
            const id = val.id
            const lawName = val.law_name
            const article = val.article
            const paragraph = val.paragraph
            const item = val.item
            const text = val.text

            //データ整形
            let meta = `${lawName} ${article}条`
            if(paragraph != null){
                meta += `${paragraph}項`
            }
            if(item != null){
                meta += `${item}号`
            }

            let content = ''
            if(text.length > 10){
                content = text.slice(0,20) + '・・・'       //履歴欄に切り出す文字数を指定
            } else {
                content = text
            }

            //要素作成
            const newDiv = templateHistory.content.cloneNode(true).firstElementChild

            const metaElement = newDiv.querySelector('.meta')
            const contentElement = newDiv.querySelector('.content')
            metaElement.textContent = meta
            contentElement.textContent = content
            newDiv.setAttribute('data-id',id)

            history.appendChild(newDiv)
        })
    } catch (e){
        errorDisplay(e)
    }

}

async function searchFromInput(){
    try{
        errorDiv.classList.add('hidden')

        const lawNameStr = lawNameSelect.value
        const articleNum = articleInput.value
        const paragraphNum = paragraphInput.value
        const itemNum = itemInput.value
        let keywordsStr = keywordsInput.value

        // keywordsを配列に変換
        const rawKeywords = keywordsStr.split(/[\s,、　]+/);
        const keywords = rawKeywords.filter(keyword => keyword !== '')

        // サーバリクエスト
        const request = {
            action:'search-from-input',
            law_name:lawNameStr,
            article:articleNum,
            paragraph:paragraphNum,
            item:itemNum,
            keywords:keywords
        }

        const resultData = await postServer(request)

        resultDisplay(resultData)
    } catch(e){
        errorDisplay(e)
    }
}

function searchFromHistory(id){
    try{
        const wholeData = JSON.parse(localStorage.getItem('law_data'))
        wholeData.data.some(val => {
            if(val.id == id){
                const resultData = {data:[val]}
                resultDisplay(resultData)
                return true
            }
        })
    } catch(e){
        errorDisplay(e)
    }

}

function resultDisplay(resultData){
    result.innerHTML = ''
    const keywords = resultData.keywords
    const data = resultData.data

    //検索結果数の表示
    const searchNumElement = document.createElement('p')
    const searchNumText = `${data.length}件がヒットしました。`
    searchNumElement.textContent = searchNumText
    result.appendChild(searchNumElement)

    //各条文の内容表示
    data.forEach(val => {
        const lastModified = val.last_modified
        const id = val.id
        const lawName = val.law_name
        const article = val.article
        const paragraph = val.paragraph
        const item = val.item
        const text = val.text

        //条項号のテキスト作成
        let meta = `${lawName} ${article}条`
        if(paragraph != null){
            meta += `${paragraph}項`
        }
        if(item != null){
            meta += `${item}号`
        }
        meta += `<span>最終更新日時：${lastModified}</span>`

        //要素生成・検索ハイライト
        const newDiv = template.content.cloneNode(true).firstElementChild
        const pMeta = newDiv.querySelector('.meta')
        const pText = newDiv.querySelector('.text')
        const saveStr = JSON.stringify({
            "data": [
                {
                "last_modified":lastModified,
                "id": id,
                "law_name": lawName,
                "article": article,
                "paragraph": paragraph,
                "item": item,
                "text": text
                }
            ]})

        pMeta.innerHTML = meta
        pText.textContent = text
        newDiv.setAttribute('data-save', saveStr)

        if(keywords){
            const escapedKeywords = keywords
                .sort((a, b) => b.length - a.length)
                .map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
            const regex = new RegExp(`(${escapedKeywords.join('|')})`, 'gi');
            const markedText = escapeHTML(text).replace(regex, `<mark>$1</mark>`)
            pText.innerHTML = markedText
        }

        result.appendChild(newDiv)
    });
}

// HTMLのheadでSupabase CDNを読み込んでいる前提
// const supabase = supabase.createClient(URL, KEY);

async function postServer(request){
    // Supabaseの管理画面で確認できるURLとANON_KEY
    const SUPABASE_URL = 'https://ditxmrgfntsndjsmaagg.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_XV855Fm-T69rS-8WAUWVTw_96ZJI6A7';

    // クライアントの作成
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { action } = request;

    // A. 法令名リストの取得 (load時)
    if(action === 'load'){
        const { data, error } = await supabase
            .rpc('get_law_names'); 

        if(error) throw error.message;

        // dataは [{law_name: "会社法"}, {law_name: "民法"}...] の形式で返ってきます
        const names = data.map(d => d.law_name);
        return { law_name_list: names };
    }

    // B. 検索 (search-from-input時)
    if(action === 'search-from-input'){
        let query = supabase.from('laws').select('*');

        // 条件付与
        if(request.law_name) query = query.eq('law_name', request.law_name);
        if(request.article) query = query.eq('article', request.article);
        if(request.paragraph) query = query.eq('paragraph', request.paragraph);
        if(request.item) query = query.eq('item', request.item);

        // 全文検索
        if(request.keywords && request.keywords.length > 0){
            request.keywords.forEach(word => {
                // 全キーワードが含まれるようにAND条件でつなぐ
                query = query.ilike('text', `%${word}%`);
            });
        }

        const { data, error } = await query;
        if(error) throw error.message;

        // 呼び出し元の期待する形式で返す
        return { 
            status: 'success', 
            data: data,
            keywords: request.keywords 
        };
    }
}

function saveCache(resultData){
    const maxHistoryNum = 4    //履歴数の最大値
    const before = JSON.parse(localStorage.getItem('law_data'))

    const newData = []
    //すでに履歴があればそれを一旦排除
    if(before){
        const beforeData = before.data 
        for (i = 0; i < beforeData.length; i++){
            const pushNeed = resultData.data.every(val =>{
                const id = val.id
                if (beforeData[i].id == id){
                    return false
                }
                return true
            })
            if(pushNeed){newData.push(beforeData[i])}
        }
    }

    //今回分を追加
    resultData.data.forEach(val => {
        newData.push(val)
     })

    //履歴数の上限チェック
    while (newData.length > maxHistoryNum){
        newData.shift()
    }

    //保存
    const dataForSave = JSON.stringify({
        data:newData
    })
    localStorage.setItem('law_data',dataForSave)
    alert('履歴に保存されました。')
    load()
}

function mistakeDisplay(mistakeList){
    const errStr = mistakeList.join('¥n')
    errorDiv.textContent = errStr
    errorDiv.classList.remove('hidden')
}

function errorDisplay(errorMsg){
    alert(`エラーが発生しました：${errorMsg}`)
    return
}

// エスケープ関数を追加
function escapeHTML(str) {
    return str.replace(/[&<>"']/g, function(match) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[match];
    });
}

/*{'status':'error','errorMsg':'error message'}
{status:'success',ReArticleNums: [],ReParagraphNums: [], ReItemNums: [], contents: []}

{
  "status": "success",
  "total_count": 1,
  "keywords": ["の","は"],
  "data": [
    {
    "last_modified": ,
      "id": 105,
      "law_name": "民法",
      "article": 709,
      "paragraph": null,
      "item": null,
      "text": "故意又は過失によって他人の権利又は法律上保護される利益を侵害した者は、これによって生じた損害を賠償する責任を負う。"
    }
  ]
}

{
"data": [
    {
    "last_modified": ,
      "id":105,
      "law_name": "民法",
      "article": 709,
      "paragraph": null,
      "item": null,
      "text": "故意又は過失によって他人の権利又は法律上保護される利益を侵害した者は、これによって生じた損害を賠償する責任を負う。"
    }
  ]}

{
  status: 'success',   
    law_name_list:[]
*/