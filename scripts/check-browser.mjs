import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
const modulePath=process.env.CLOUDFIRE_PLAYWRIGHT_MODULE;
const { chromium }=await import(modulePath?pathToFileURL(modulePath).href:"playwright");
const base=process.env.CLOUDFIRE_BASE_URL??"http://localhost:3001";
const production=process.env.CLOUDFIRE_EXPECT_PRODUCTION==="1";
const browser=await chromium.launch({channel:process.env.CLOUDFIRE_BROWSER_CHANNEL||undefined,headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
const errors=[];page.on("pageerror",error=>errors.push(error.message));
try{
 const routes=["/","/capabilities","/work","/industries","/insights","/company","/contact","/privacy","/insights/start-with-the-workflow"];
 for(const width of [1440,768,390,320]){
  await page.setViewportSize({width,height:width<800?844:1000});
  for(const route of routes){
   const response=await page.goto(base+route,{waitUntil:"networkidle"});
   assert.equal(response.status(),200,route);
   assert.equal(await page.locator("h1").count(),1,route+" has one primary heading");
   assert.equal(await page.locator(".site-header").count(),1);
   assert.equal(await page.locator(".site-footer").count(),1);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   assert.ok(overflow<=1,route+" overflows at "+width+" by "+overflow);
   if(production)assert.doesNotMatch(await page.locator("body").innerText(),/DEVELOPMENT PREVIEW|NOT CLIENT WORK|CONTENT PLACEHOLDER|GlobalBank Corp|TechStart|Appify|200%|40%/);
  }
  console.log("Route, layout and content checks passed at "+width+"px.");
 }
 for(const [from,to] of [["/services","/capabilities"],["/projects","/work"],["/delivered-projects","/work"],["/about","/company"],["/pricing","/contact"],["/testimonials","/work"],["/how-we-work","/company"],["/why-choose-us","/company"],["/ai-automation","/capabilities#ai-automation"],["/services/web-development","/capabilities#product-engineering"],["/ai-automation/workflow-automation","/capabilities#ai-automation"]]){
  await page.goto(base+from,{waitUntil:"networkidle"});assert.equal(new URL(page.url()).pathname+new URL(page.url()).hash,to);
 }
 console.log("Legacy redirects passed.");
 for(const route of ["/work/not-a-published-study","/insights/missing","/services/missing","/ai-automation/missing"]){
  const response=await page.goto(base+route,{waitUntil:"networkidle"});assert.equal(response.status(),404,route);
 }
 console.log("Unknown content returns 404.");
 await page.setViewportSize({width:1440,height:1000});await page.goto(base,{waitUntil:"networkidle"});
 await page.screenshot({path:"design/qa-desktop.png"});
 await page.locator("#work").scrollIntoViewIfNeeded();await page.screenshot({path:"design/qa-work.png"});
 await page.getByRole("tab",{name:"02 AI & Automation"}).click();await page.getByRole("tabpanel").getByRole("heading",{name:"Less busywork. More possibility."}).waitFor();
 await page.getByRole("tab",{name:"02 AI & Automation"}).press("ArrowDown");assert.match(await page.getByRole("tab",{selected:true}).innerText(),/Cloud & Platform/);
 await page.locator("#capabilities").scrollIntoViewIfNeeded();await page.screenshot({path:"design/qa-capabilities.png"});
 await page.locator("#ai").scrollIntoViewIfNeeded();await page.getByRole("button",{name:"03 Internal Operations"}).click();await page.getByRole("heading",{name:"Turn documents into decisions."}).waitFor();
 await page.getByRole("button",{name:"05 Scale",exact:false}).click();assert.match(await page.locator(".workflow-detail").innerText(),/Observe real usage/);
 await page.locator("#engineering").scrollIntoViewIfNeeded();await page.screenshot({path:"design/qa-engineering.png"});
 console.log("Capability, keyboard, AI and delivery interactions passed.");
 await page.setViewportSize({width:390,height:844});await page.goto(base,{waitUntil:"networkidle"});await page.screenshot({path:"design/qa-mobile.png"});
 await page.locator("summary[aria-label='Navigation menu']").click();await page.screenshot({path:"design/qa-mobile-menu.png"});
 await page.locator("summary[aria-label='Navigation menu']").press("Escape");assert.equal(await page.locator(".mobile-nav").getAttribute("open"),null);
 await page.locator("summary[aria-label='Navigation menu']").click();await page.getByRole("navigation",{name:"Mobile navigation"}).getByRole("link",{name:"Capabilities",exact:true}).click();await page.waitForURL("**/capabilities");assert.equal(await page.locator(".mobile-nav").getAttribute("open"),null);
 console.log("Mobile navigation and Escape behavior passed.");
 await page.goto(base+"/contact?capability=cloud-platform",{waitUntil:"networkidle"});assert.equal(await page.locator("#capability").inputValue(),"cloud-platform");
 await page.getByRole("button",{name:"Prepare project brief"}).click();assert.equal(await page.locator("#draft").count(),0,"Required fields prevent invalid briefs");
 await page.getByLabel("Your name *",{exact:true}).fill("Test User");await page.getByLabel("Work email *",{exact:true}).fill("test@example.com");await page.getByLabel("Company *",{exact:true}).fill("Test Fixture");await page.getByLabel("Tell us about the challenge *",{exact:true}).fill("Test fixture: improve a business process and make it easier to review.");
 await page.getByRole("button",{name:"Prepare project brief"}).click();await page.getByRole("heading",{name:"Your project, in focus."}).waitFor();
 const draft=await page.locator("#draft").inputValue();const mailto=new URL(await page.getByRole("link",{name:"Open email draft"}).getAttribute("href"));
 assert.equal(mailto.protocol,"mailto:");assert.equal(mailto.searchParams.get("body"),draft);assert.match(draft,/Cloud & Platform/);
 const downloadPromise=page.waitForEvent("download");await page.getByRole("button",{name:"Save brief"}).click();const download=await downloadPromise;assert.equal(download.suggestedFilename(),"cloudfire-project-brief.txt");
 await page.screenshot({path:"design/qa-contact.png"});console.log("Contact validation, prefill, email encoding and brief download passed.");
 await page.emulateMedia({reducedMotion:"reduce"});await page.goto(base,{waitUntil:"networkidle"});
 const motion=await page.locator(".line-mask > span").first().evaluate(element=>({transform:getComputedStyle(element).transform,duration:parseFloat(getComputedStyle(element).animationDuration)}));
 assert.equal(motion.transform,"none");assert.ok(motion.duration<0.001);
 assert.equal(errors.length,0,errors.join("\n"));console.log("Reduced motion and runtime-error checks passed.");
}finally{await browser.close();}
