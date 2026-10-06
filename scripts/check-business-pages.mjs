import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
const { chromium, webkit } = await import(process.env.CLOUDFIRE_PLAYWRIGHT_MODULE ? pathToFileURL(process.env.CLOUDFIRE_PLAYWRIGHT_MODULE).href : "playwright");
const kind = process.env.CLOUDFIRE_ENGINE || "chromium";
const browser = await (kind === "webkit" ? webkit : chromium).launch({headless:true, executablePath:kind === "chromium" ? process.env.CLOUDFIRE_TEST_BROWSER : undefined, args:kind === "chromium" ? ["--enable-unsafe-swiftshader"] : []});
const base = process.env.CLOUDFIRE_BASE_URL || "http://localhost:3002";
const output = process.env.CLOUDFIRE_QA_OUTPUT;
const errors=[];
const activate = async (locator, width) => width < 600 ? locator.tap() : locator.click();
const paths=["/","/contact","/industries","/insights","/services","/services/product-engineering","/services/ai-automation","/work/modulx","/work/aegisstore","/work/death-wish-coffee","/work/101-blockchains","/privacy"];
try {
 for(const width of kind === "webkit" ? [390,320] : [1440,390,320]) {
  const page = await browser.newPage({viewport:{width,height:width<600?844:1000},hasTouch:width<600,isMobile:width<600});
  page.on("pageerror",error=>errors.push(error.message));
  await page.addInitScript(()=>{window.__events=[];window.umami={track:(name,data)=>window.__events.push({name,data})};});
  for(const path of paths) {
   const response=await page.goto(base+path,{waitUntil:"networkidle"});
   assert.equal(response.status(),200,path);
   assert.equal(await page.locator("h1").count(),1);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=1,path+" overflows "+width);
   assert.ok(await page.locator('meta[name="description"]').getAttribute("content"),path+" description");
   const canonical = new URL(await page.locator('link[rel="canonical"]').getAttribute("href")); assert.equal(canonical.origin,"https://www.cloudfireitservices.com"); assert.equal(canonical.pathname,path);
   assert.ok(await page.locator('meta[property="og:image"]').getAttribute("content"));
   assert.equal(await page.locator('meta[name="twitter:card"]').getAttribute("content"),"summary_large_image");
   assert.doesNotMatch(await page.locator("main").innerText(),/\bbudget\b|FOUNDER|CEO|projects from/i);
   if(output && kind==="chromium" && [1440,390].includes(width) && ["/industries","/insights","/contact","/work/modulx","/services/product-engineering"].includes(path))
    { await page.evaluate(()=>document.querySelectorAll("[data-reveal]").forEach(el=>el.setAttribute("data-in",""))); await page.waitForTimeout(1800); await page.locator("main").screenshot({path:output+"/business-"+path.slice(1).replaceAll("/","-")+"-"+width+".png"}); }
  }
  await page.goto(base+"/contact?capability=cloud-platform",{waitUntil:"networkidle"});
  assert.equal(await page.locator("#capability").inputValue(),"cloud-platform");
  assert.equal(await page.locator("#budget").count(),0);
  if(await page.getByRole("button",{name:"Send enquiry",exact:true}).isEnabled()){
   let calls=0;const payloads=[];
   await page.route("**/api/contact",async route=>{
    calls++; payloads.push(route.request().postDataJSON());
    await new Promise(resolve=>setTimeout(resolve,120));
    await route.fulfill({status:calls===1?503:200,contentType:"application/json",body:JSON.stringify({message:calls===1?"Your enquiry could not be sent just yet. Please try again.":"Your enquiry has been submitted."})});
   });
   await page.getByLabel("Your name *",{exact:true}).fill("Test Visitor");
   await page.getByLabel("Work email *",{exact:true}).fill("visitor@example.com");
   await page.getByLabel("Company *",{exact:true}).fill("Test Company");
   await page.getByLabel("Tell us about the challenge *",{exact:true}).fill("Build a clear enquiry workflow and a connected application.");
   await activate(page.getByRole("button",{name:"Send enquiry",exact:true}),width);
   await page.getByText("Your enquiry could not be sent just yet. Please try again.",{exact:true}).waitFor();
   assert.equal(await page.locator("#name").inputValue(),"Test Visitor");
   assert.equal(await page.locator("#company").inputValue(),"Test Company");
   await activate(page.getByRole("button",{name:"Send enquiry",exact:true}),width);
   await page.getByRole("heading",{name:"Your enquiry is on its way."}).waitFor();
   assert.equal(calls,2);
   assert.equal(payloads[0].requestId,payloads[1].requestId);
   assert.ok(!("budget" in payloads[0]));
   const events=await page.evaluate(()=>window.__events);
   assert.ok(events.some(event=>event.name==="enquiry_success"));
   assert.ok(events.some(event=>event.name==="enquiry_error"));
   assert.doesNotMatch(JSON.stringify(events),/visitor@example.com|Test Visitor|Test Company/);
   await activate(page.getByRole("button",{name:"Send another enquiry"}),width);
   await page.locator("#name").waitFor();
  } else assert.ok(await page.getByText(/Online enquiries are temporarily unavailable/).isVisible());
  await page.goto(base,{waitUntil:"networkidle"});
  await page.locator("#ai").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1100);
  if(width<600) {
   assert.equal(await page.locator(".hero-art").isVisible(),true,"phones retain the approved project deck");
   assert.equal(await page.locator("#ai canvas").count(),0,"phones avoid 3D rendering");
   assert.equal(await page.locator("#ai [data-quality=light]").count(),1);
  }
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.waitForTimeout(200);
  assert.equal(await page.locator("#ai canvas").count(),0,"reduced motion avoids 3D rendering");
  assert.equal(await page.locator("#ai [data-quality=light]").count(),1);
  await activate(page.getByRole("button",{name:"03 Internal Operations",exact:true}),width);
  await page.getByRole("heading",{name:"Turn documents into decisions.",exact:true}).waitFor();
  console.log(kind+": routes, metadata, form states, no budget/founder and lightweight motion pass at "+width+"px.");
  await page.close();
 }
 const page=await browser.newPage();
 const sitemap=await page.request.get(base+"/sitemap.xml");
 assert.equal(sitemap.status(),200);assert.match(await sitemap.text(),/services\/cloud-platform/);assert.match(await sitemap.text(),/work\/aegisstore/);
 const robots=await page.request.get(base+"/robots.txt");assert.equal(robots.status(),200);assert.match(await robots.text(),/Disallow: \/api\//);
 const image=await page.request.get(base+"/opengraph-image");assert.equal(image.status(),200);assert.match(image.headers()["content-type"],/image\/png/);
 assert.equal((await page.request.get(base+"/work/not-a-project")).status(),404);
 assert.equal(errors.length,0,errors.join("\n"));
 console.log(kind+": sitemap, robots, social image, unknown routes and runtime checks pass.");
} finally {await browser.close();}
