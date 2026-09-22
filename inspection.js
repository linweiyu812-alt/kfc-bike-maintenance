const sb=supabase.createClient(KFC_CONFIG.SUPABASE_URL,KFC_CONFIG.SUPABASE_KEY),$=x=>document.getElementById(x);
let bike=null,timer;
const items=[["engine_ok","引擎發動"],["front_brake_ok","前煞系統"],["rear_brake_ok","後煞系統"],["headlight_ok","車頭大燈"],["tire_ok","輪胎"]];
$("checks").innerHTML=items.map(x=>`<div class="check"><span>${x[1]}</span><select id="${x[0]}"><option value="true">正常</option><option value="false">異常</option></select></div>`).join("");

async function loadCenters(){
 const {data,error}=await sb.from("centers").select("id,code,name").eq("active",true).order("name");
 if(error){$("center").innerHTML="<option>中心載入失敗</option>";return}
 $("center").innerHTML='<option value="">請選擇領車中心</option>'+data.map(c=>`<option value="${c.id}">${c.name}</option>`).join("");
 const p=new URLSearchParams(location.search).get("center"),c=data.find(x=>x.code===p);
 if(c){$("center").value=c.id;$("search").disabled=false}
}
$("center").onchange=()=>{bike=null;$("search").value="";$("results").innerHTML="";$("selected").innerHTML="";$("bikeWarning").innerHTML="";$("search").disabled=!$("center").value};
$("search").oninput=()=>{clearTimeout(timer);timer=setTimeout(searchBike,250)};
async function searchBike(){
 const q=$("search").value.trim().toUpperCase();
 if(q.length<2||!$("center").value){$("results").innerHTML="";return}
 const {data,error}=await sb.from("bikes").select("id,plate,vehicle_type,center_id").eq("active",true).eq("center_id",$("center").value).ilike("plate",`%${q}%`).limit(10);
 if(error){$("results").innerHTML='<div class="result">搜尋失敗</div>';return}
 $("results").innerHTML=data.length?data.map((b,i)=>`<div class="result" data-i="${i}"><strong>${b.plate}</strong><small>${b.vehicle_type==="electric"?"電動車":"油車"}</small></div>`).join(""):'<div class="result">找不到車牌</div>';
 document.querySelectorAll("[data-i]").forEach(e=>e.onclick=()=>chooseBike(data[+e.dataset.i]));
}
async function chooseBike(b){
 bike=b;$("search").value=b.plate;$("results").innerHTML="";
 $("selected").className="chosen";$("selected").innerHTML=`✓ 已選擇 <strong>${b.plate}</strong>・${b.vehicle_type==="electric"?"電動車":"油車"}`;
 $("energyTitle").textContent=b.vehicle_type==="electric"?"目前電量 %":"目前汽油存量 %";
 await loadBikeWarnings();
}
async function loadBikeWarnings(){
 if(!bike)return;
 const {data,error}=await sb.rpc("get_open_bike_maintenance",{p_bike_id:bike.id});
 if(error){$("bikeWarning").innerHTML='<div class="warning">無法讀取維修狀態</div>';return}
 if(!data.length){$("bikeWarning").innerHTML="";return}
 $("bikeWarning").innerHTML=`<div class="warning"><h3>⚠ 此機車有尚未完成的維修項目</h3>${data.map(x=>`<div class="issue"><strong>${x.issue_description||x.issue_type||"待維修"}</strong><br><small>${new Date(x.reported_at).toLocaleString("zh-TW")}</small><br><button type="button" data-mid="${x.id}">✓ 確認已維修完成</button></div>`).join("")}</div>`;
 document.querySelectorAll("[data-mid]").forEach(b=>b.onclick=()=>completeBikeIssue(b.dataset.mid));
}
async function completeBikeIssue(id){
 const name=$("inspector").value.trim();
 if(!name){message("請先填寫領車人姓名，再確認維修完成",0);return}
 if(!confirm("確認此維修項目已實際完成？"))return;
 const {data,error}=await sb.rpc("complete_bike_maintenance",{p_maintenance_id:id,p_completed_by:name});
 if(error||!data){message("維修完成更新失敗",0);return}
 message("✓ 已更新為維修完成",1);loadBikeWarnings();
}
$("checkDashcam").onclick=loadDashcamWarnings;
async function loadDashcamWarnings(){
 const no=$("dashcam").value.trim();if(!no){message("請先輸入行車紀錄器號碼",0);return}
 const {data,error}=await sb.rpc("get_open_dashcam_issues",{p_dashcam_number:no});
 if(error){$("dashcamWarning").innerHTML='<div class="warning">無法讀取紀錄器狀態</div>';return}
 if(!data.length){$("dashcamWarning").innerHTML='<div class="chosen">✓ 目前沒有未完成的行車紀錄器異常</div>';return}
 $("dashcamWarning").innerHTML=`<div class="warning"><h3>⚠ 此行車紀錄器有未完成異常</h3>${data.map(x=>`<div class="issue"><strong>${x.issue_description}</strong><br><small>${new Date(x.reported_at).toLocaleString("zh-TW")}</small><br><button type="button" data-did="${x.id}">✓ 確認已處理完成</button></div>`).join("")}</div>`;
 document.querySelectorAll("[data-did]").forEach(b=>b.onclick=()=>completeDashcamIssue(b.dataset.did));
}
async function completeDashcamIssue(id){
 const name=$("inspector").value.trim();if(!name){message("請先填寫領車人姓名",0);return}
 if(!confirm("確認此行車紀錄器異常已實際處理完成？"))return;
 const {data,error}=await sb.rpc("complete_dashcam_issue",{p_issue_id:id,p_completed_by:name});
 if(error||!data){message("更新失敗",0);return}
 message("✓ 行車紀錄器異常已完成",1);loadDashcamWarnings();
}
$("dashcamAbnormal").onchange=()=>$("dashcamIssue").classList.toggle("hidden",!$("dashcamAbnormal").checked);

$("form").onsubmit=async e=>{
 e.preventDefault();if(!bike)return message("請先搜尋並選擇機車",0);
 const btn=$("submit");btn.disabled=true;btn.textContent="送出中...";
 const oks=Object.fromEntries(items.map(x=>[x[0],$(x[0]).value==="true"]));
 const bad=Object.values(oks).some(v=>!v)||$("tread").value==="true";
 const payload={center_id:$("center").value,bike_id:bike.id,inspector_name:$("inspector").value.trim(),dashcam_number:$("dashcam").value.trim()||null,mileage:+$("mileage").value,front_tire_pressure:+$("front").value,rear_tire_pressure:+$("rear").value,tire_tread_abnormal:$("tread").value==="true",cup_holder_qty:+$("cups").value,delivery_bag_qty:+$("bags").value,fuel_battery_level:$("energy").value?+$("energy").value:null,...oks,dashcam_ok:null,status:bad?"abnormal":"normal",note:$("note").value.trim()||null};
 const {error}=await sb.from("inspections").insert(payload);
 if(error){message("送出失敗："+error.message,0);btn.disabled=false;btn.textContent="確認並送出";return}
 if($("dashcamAbnormal").checked){
   const desc=$("dashcamIssue").value.trim();
   if(!$("dashcam").value.trim()||!desc){message("機車檢查已送出，但行車紀錄器異常資料不完整，未建立紀錄器異常單",0)}
   else await sb.rpc("report_dashcam_issue",{p_center_id:$("center").value,p_dashcam_number:$("dashcam").value.trim(),p_issue_description:desc,p_reported_by:$("inspector").value.trim()});
 }
 message(`✓ 已送出｜${bike.plate}｜${bad?"機車有異常，已建立待維修":"機車正常"}`,1);
 e.target.reset();bike=null;$("selected").innerHTML="";$("bikeWarning").innerHTML="";$("dashcamWarning").innerHTML="";$("dashcamIssue").classList.add("hidden");$("search").disabled=true;btn.disabled=false;btn.textContent="確認並送出";loadCenters();
};
function message(t,ok){$("msg").className="msg "+(ok?"ok":"err");$("msg").textContent=t}
loadCenters();