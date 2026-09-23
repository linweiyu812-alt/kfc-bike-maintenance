const sb=supabase.createClient(KFC_CONFIG.SUPABASE_URL,KFC_CONFIG.SUPABASE_KEY),$=x=>document.getElementById(x);
let restaurant=null,timer=null;
const centerMap={TP01:"I997-",NT01:"I994-",TY01:"I995-",TC01:"I996-",TN01:"I998-",KH01:"I981-"};
function batteryCode(){
 const c=$("center").value,s=$("suffix").value.replace(/\D/g,"");
 if(!c||!s)return "";
 return centerMap[c]+s.padStart(3,"0");
}
function preview(){const code=batteryCode();$("batteryPreview").textContent="本次回報電池："+(code||"-")}
$("center").onchange=()=>{restaurant=null;$("restaurantSearch").value="";$("restaurantSelected").textContent="";$("restaurantResults").innerHTML="";const c=$("center").value;$("prefix").textContent=c?centerMap[c]:"請先選中心";$("suffix").disabled=!c;$("restaurantSearch").disabled=!c;preview()};
$("suffix").oninput=e=>{e.target.value=e.target.value.replace(/\D/g,"").slice(0,6);preview()};
$("suffix").onblur=e=>{if(e.target.value)e.target.value=e.target.value.padStart(3,"0");preview()};
$("restaurantSearch").oninput=()=>{restaurant=null;$("restaurantSelected").textContent="";clearTimeout(timer);timer=setTimeout(searchRestaurant,180)};
async function searchRestaurant(){const q=$("restaurantSearch").value.trim(),c=$("center").value;if(!q||!c)return;$("restaurantResults").innerHTML='<div class="result">搜尋中…</div>';const {data,error}=await sb.rpc("public_restaurant_search",{p_center_code:c,p_keyword:q});if(error){$("restaurantResults").innerHTML=`<div class="result">${error.message}</div>`;return}$("restaurantResults").innerHTML=(data||[]).map((r,i)=>`<div class="result" data-r="${i}"><b>${r.name}</b><small>${r.store_no||""}</small></div>`).join("")||'<div class="result">找不到餐廳</div>';document.querySelectorAll("[data-r]").forEach(e=>e.onclick=()=>{restaurant=data[+e.dataset.r];$("restaurantSearch").value=restaurant.name;$("restaurantResults").innerHTML="";$("restaurantSelected").textContent=`✓ ${restaurant.name}${restaurant.store_no?"｜"+restaurant.store_no:""}`})}
$("form").onsubmit=async e=>{e.preventDefault();const code=batteryCode();if(!code)return alert("請輸入電池編號");if(!restaurant)return alert("請先從搜尋結果選擇放置餐廳");const issue=$("issue").value.trim(),who=$("reportedBy").value.trim();if(!issue||!who)return;const {data,error}=await sb.rpc("report_battery_fault",{p_restaurant_id:restaurant.id,p_battery_code:code,p_reported_by:who,p_issue_description:issue});if(error){$("msg").textContent=error.message;return}$("msg").textContent=`✓ 已送出 ${code} 故障回報`;$("suffix").value="";$("issue").value="";$("reportedBy").value="";restaurant=null;$("restaurantSearch").value="";$("restaurantSelected").textContent="";preview()};

// Prevent the browser from restoring a center visually without updating the prefix.
window.addEventListener("pageshow",()=>{
  const c=$("center").value;
  $("prefix").textContent=c&&centerMap[c]?centerMap[c]:"請先選中心";
  $("suffix").disabled=!c;
  $("restaurantSearch").disabled=!c;
  preview();
});
