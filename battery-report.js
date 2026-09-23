const sb=supabase.createClient(KFC_CONFIG.SUPABASE_URL,KFC_CONFIG.SUPABASE_KEY),$=x=>document.getElementById(x);
let restaurant=null,timer,stream=null,confirmedCode="";

async function init(){
  const {data,error}=await sb.from("centers").select("id,code,name").eq("active",true);
  if(error){$("scanHelp").textContent="中心資料載入失敗："+error.message;return}
  const order={TP01:1,NT01:2,TY01:3,TC01:4,TN01:5,KH01:6};
  $("center").innerHTML='<option value="">請選擇外送中心</option>'+
    [...(data||[])].sort((a,b)=>(order[a.code]||99)-(order[b.code]||99))
    .map(c=>`<option value="${c.id}">${c.name}</option>`).join("");
}

function proceedWithCode(code){
  code=String(code||"").trim();
  if(!code)return alert("請先掃描 QR Code 或輸入電池編號");
  confirmedCode=code;
  $("batteryCode").value=code;
  $("batteryDisplay").textContent=`電池編號：${code}`;
  $("scanStep").classList.add("hidden");
  $("form").classList.remove("hidden");
  stopScan();
  window.scrollTo({top:0,behavior:"smooth"});
}

$("confirmCode").onclick=()=>proceedWithCode($("batteryCode").value);

$("changeBattery").onclick=()=>{
  confirmedCode="";
  $("form").classList.add("hidden");
  $("scanStep").classList.remove("hidden");
  $("msg").textContent="";
  window.scrollTo({top:0,behavior:"smooth"});
};

$("center").onchange=()=>{
  restaurant=null;
  $("restaurantSearch").value="";
  $("restaurantResults").innerHTML="";
  $("restaurantSelected").innerHTML="";
};

$("restaurantSearch").oninput=()=>{
  restaurant=null;
  $("restaurantSelected").innerHTML="";
  clearTimeout(timer);
  timer=setTimeout(searchR,180);
};

async function searchR(){
  const q=$("restaurantSearch").value.trim();
  if(!q||!$("center").value){$("restaurantResults").innerHTML="";return}
  const {data,error}=await sb.rpc("public_restaurant_search",{p_center_id:$("center").value,p_keyword:q});
  if(error){$("restaurantResults").innerHTML=`<div class="result">搜尋失敗：${error.message}</div>`;return}
  $("restaurantResults").innerHTML=(data||[]).map((r,i)=>`<div class="result" data-i="${i}"><b>${r.name}</b><small>${r.store_no||""}</small></div>`).join("")||'<div class="result">找不到餐廳</div>';
  document.querySelectorAll("[data-i]").forEach(e=>e.onclick=()=>{
    restaurant=data[+e.dataset.i];
    $("restaurantSearch").value=restaurant.name;
    $("restaurantResults").innerHTML="";
    $("restaurantSelected").className="chosen";
    $("restaurantSelected").textContent=`✓ 已選擇：${restaurant.name}${restaurant.store_no?`｜${restaurant.store_no}`:""}`;
  });
}

$("scan").onclick=async()=>{
  if(!("BarcodeDetector" in window)){
    $("scanHelp").textContent="此瀏覽器不支援直接掃描，請使用下方手動輸入電池編號。";
    return;
  }
  try{
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}}});
    $("video").srcObject=stream;
    $("video").style.display="block";
    await $("video").play();
    $("scanHelp").textContent="請將 QR Code 對準鏡頭";
    const detector=new BarcodeDetector({formats:["qr_code"]});
    const loop=async()=>{
      if(!stream)return;
      try{
        const codes=await detector.detect($("video"));
        if(codes.length){
          proceedWithCode(codes[0].rawValue);
          return;
        }
      }catch(e){}
      requestAnimationFrame(loop);
    };
    loop();
  }catch(e){
    $("scanHelp").textContent="無法開啟相機，請使用下方手動輸入電池編號。";
  }
};

function stopScan(){
  if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}
  $("video").style.display="none";
}

$("form").onsubmit=async e=>{
  e.preventDefault();
  if(!confirmedCode)return alert("請先掃描 QR Code 或確認電池編號");
  if(!restaurant)return alert("請從搜尋結果中選擇放置餐廳");
  const {data,error}=await sb.rpc("report_battery_fault",{
    p_restaurant_id:restaurant.id,
    p_battery_code:confirmedCode,
    p_reported_by:$("reporter").value.trim(),
    p_issue_description:$("issue").value.trim()
  });
  if(error){$("msg").textContent="送出失敗："+error.message;return}
  $("msg").textContent="✓ 電池故障已回報";
  setTimeout(()=>location.href="./index.html",900);
};

window.addEventListener("beforeunload",stopScan);
init();