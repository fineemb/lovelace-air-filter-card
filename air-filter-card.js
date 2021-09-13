﻿/*
 * @Author        : fineemb
 * @Github        : https://github.com/fineemb
 * @Description   : 
 * @Date          : 2019-10-12 02:38:30
 * @LastEditors   : fineemb
 * @LastEditTime  : 2021-09-13 19:03:37
 */

console.info("%c  AIR FILTER CARD  \n%c Version 1.1.4 ",
"color: orange; font-weight: bold; background: black", 
"color: white; font-weight: bold; background: dimgray");

// import(`https://unpkg.com/@juggle/resize-observer`);

const deps = ['paper-input', 'paper-dropdown-menu', 'paper-item', 'paper-listbox'];
deps.map(dep => {
  if (!customElements.get(dep)) {
    console.log("imported", dep);
    import(`https://unpkg.com/@polymer/${dep}/${dep}.js?module`);
  }
});

function loadCSS(url) {
  const link = document.createElement("link");
  link.type = "text/css";
  link.rel = "stylesheet";
  link.href = url;
  document.head.appendChild(link);
}


loadCSS("https://fonts.googleapis.com/css2?family=Anton&display=swap");

const LitElement = Object.getPrototypeOf(
  customElements.get("ha-panel-lovelace")
);
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;
export class AirFilterCard extends HTMLElement {
  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
    this.root.innerHTML = this._gethtml();
    this.root.querySelector("#container").appendChild(this.getBg());
    this.modes = ["auto","silent","strong"]
}
static getConfigElement() {
  return document.createElement("air-filter-editor");
}
static getStubConfig() {
  return {modes: ["auto","silent","strong"],
          spect_ratio:1,
          entity:"" }
}
  set hass(hass) {

    setTimeout(() => {
      let airBox = this.root.querySelector("#air").getBoundingClientRect();

      this.root.querySelector("#pm25u").style.fontSize = airBox.height*.8/12+'px';
      this.root.querySelector("#pm25u").style.lineHeight = airBox.height*.8/12+'px';

      this.root.querySelector("#title").style.fontSize = airBox.height*.8/10+'px';
      this.root.querySelector("#title").style.lineHeight = airBox.height*.8/10+'px';

      this.root.querySelector("#pm25").style.fontSize = airBox.height*.8/5*2+'px';
      this.root.querySelector("#pm25").style.lineHeight = airBox.height*.8/5*2+'px';
    },1)
    let entityId
    var patt = new RegExp("^fan")
    if(this._config.entity){
      entityId = this._config.entity;
    }else{
      Object.keys(hass.states).filter(a => patt.test(a) ).map(entId => {
        entityId = entId;
      });
    }
    // Luc3as was here, added custom sensor for AQI, it is no longer in attribute list of fan
    let device_prefix = entityId.split(".");
    if (device_prefix[1] != "") {
      device_prefix = device_prefix[1];
    }
    let aqi = hass.states["sensor." + device_prefix + "_pm2_5"].state;
    this.root.querySelector("#pm25").innerHTML = aqi<10?"0"+aqi:aqi;
    this.root.querySelector("#bg").className = hass.states[entityId].state?hass.states[entityId].state:"N/C";
    this.root.querySelector("#title").innerHTML = this._config.title||hass.states[entityId].attributes.friendly_name||"Air purifier";

    // 质量
    let quality = '优'
    let air = this.root.querySelector("#air")
    if (aqi < 50) {
      quality = '优'
      air.className='level-1'
    }
    else if (aqi < 100) {
      quality = '良'
      air.className='level-2'
    }
    else if (aqi < 150) {
      quality = '轻度污染'
      air.className='level-3'
    }
    else if (aqi < 200) {
      quality = '中度污染'
      air.className='level-4'
    }
    else if (aqi < 300) {
      quality = '重度污染'
      air.className='level-5'
    }
    else {
      quality = '严重污染'
      air.className='level-6'
    }

    this.root.querySelector("#pm25").onclick = () => {
      hass.callService('fan', 'toggle', {
        entity_id: entityId
      });
    }
    // Luc3as was here, changed service call name for updated version of MIIO fan
    this.root.querySelector('#buttons :nth-child(1)').onclick = () => {
      hass.callService('fan', 'set_preset_mode', {
        entity_id: entityId,
        preset_mode: this.modes[0]
      });
    }
    this.root.querySelector('#buttons :nth-child(2)').onclick = () => {
      hass.callService('fan', 'set_preset_mode', {
        entity_id: entityId,
        preset_mode: this.modes[1]
      });
    }
    this.root.querySelector('#buttons :nth-child(3)').onclick = () => {
      hass.callService('fan', 'set_preset_mode', {
        entity_id: entityId,
        preset_mode: this.modes[2]
      });
    }

    let mode = hass.states[entityId].attributes.mode;
    for(var i=0;i<3;i++){
      if((this.modes[i]+"").toLowerCase()===(mode+"").toLowerCase()){
        this.root.querySelector('#buttons :nth-child('+(i+1)+')').className = "active"
      }else{
        this.root.querySelector('#buttons :nth-child('+(i+1)+')').className = ""
      }
    }

  } 
 
  setConfig(config) {
    this._config = deepClone(config);
    let entityid = this._config.entity;
    this.modes = this._config.modes;
    
    const icons = {
      auto: "mdi:brightness-auto",
      silent: "mdi:weather-night",
      favorite: "mdi:cards-heart",
      strong: "mdi:weather-windy",
      medium: "mdi:chili-medium",
      high: "mdi:chili-hot",
      low: "mdi:chili-mild",
      humidity: "mdi:air-humidifier",
      interval: "mdi:av-timer"
    }
    for(var i=0;i<3;i++){
      this.root.querySelector('#buttons :nth-child('+(i+1)+')').setAttribute("icon",icons[this._config.modes[i].toLowerCase()])
    }
    let d = this.root.querySelector("#aspect-ratio")
    d.style.paddingBottom = 100*(this._config.aspect_ratio||1)+"%"
    d.style.width = 100*(this._config.aspect_ratio||1)+"%"
    
    this.root.querySelector('.prop').onclick = () => {
      this.fire('hass-more-info', { entityId: entityid });
    }
  }

  _gethtml() {
    return this._getstyles()+`
    <ha-card>
      <div id="aspect-ratio">
        <div id="container" >
          <div id="air">
            <div id="pm25u">PM2.5</div>
            <div id="pm25">00</div>
            <div id="buttons">
              <ha-icon-button icon="mdi:brightness-auto" slot="prefix"></ha-icon-button>
              <ha-icon-button icon="mdi:weather-night" slot="prefix"></ha-icon-button>
              <ha-icon-button icon="mdi:weather-windy" slot="prefix"></ha-icon-button>
            </div>
            <div id="title">Air purifier</div>
          </div>
          <div class="prop" style="text-align: right;">
            <ha-icon-button icon="hass:dots-vertical" class="c_icon" role="button" tabindex="0" aria-disabled="false"></ha-icon-button>
          </div>
        </div>
      </div>
    </ha-card>
    `
  }

  _getstyles() {
    return `
    <style>
    :host([is-panel]) ha-card {
      left: 0;
      top: 0;
      width: 100%;
      /**
       * In panel mode we want a full height map. Since parent #view
       * only sets min-height, we need absolute positioning here
       */
      height: 100%;
      position: absolute;
    }

    ha-card {
      overflow: hidden;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
    }

    #container {
      z-index: 0;
      border: none;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    
    #aspect-ratio {
      position: relative;
      width: 100%;
      padding-bottom: 100%;
    }

    :host([is-panel]) #aspect-ratio {
      height: 100%;
    }

    #air{
      position: absolute;
      top:10%;
      left:10%;
      width: 80%;
      height: 80%;
      border-radius: 50%;
      box-sizing: border-box;
      padding: 10% 0;
      text-align: center;
      z-index: 2;
      color: #fff;
    }
    #air>div{
      height: 10%;
      margin: 6% 0;
    }
    div#pm25u{
      height: 8%;
      position: absolute;
      right: 0;
      top: 50%;
      margin-top: -10%;
      margin-right: 5%;
    }
    div#pm25{
      height: 35%;
      font-family: 'Anton', fantasy, sans-serif;
    }
    div#title{
      margin: 0;
    }
    div#buttons{
      height: 35%;
      margin: 0;
      text-align: center;
      display: flex;
      justify-content: center;
    }
    div#buttons ha-icon-button{
      width:25%;
      height: 100%;
    }
    .level-1{
      border: 5px solid #007305
    }
    .level-2{
      border: 5px solid #005b73
    }
    .level-3{
      border: 5px solid #cddc39
    }
    .level-4{
      border: 5px solid #ff9800
    }
    .level-5{
      border: 5px solid #ff5722
    }
    .level-6{
      border: 5px solid #b90f02
    }

    ha-icon-button.active{
      color:var(--paper-item-icon-active-color);
    }
    </style>
    `
  }
  fire(type, detail, options) {
  
    options = options || {}
    detail = detail === null || detail === undefined ? {} : detail
    const e = new Event(type, {
      bubbles: options.bubbles === undefined ? true : options.bubbles,
      cancelable: Boolean(options.cancelable),
      composed: options.composed === undefined ? true : options.composed,
    })
    
    e.detail = detail
    this.dispatchEvent(e)
    return e
  }
  
  getBg() {
    const styleValue = `
  #bg {
    width: 86%;
    height: 86%;
    top: 7%;
    left: 7%;
    position: absolute;
    border-radius: 50%;
    z-index:0;
    background-image: radial-gradient(#021027, #000000);
  }

  #bg.off{
    background-image: radial-gradient(#5a5a5a, #212121);
  }
  #bg.off>div{
    display: none;
  }
  
  .circle-container {
  position: absolute;
  -webkit-transform: translateY(-10vh);
  transform: translateY(-10vh);
  -webkit-animation-iteration-count: infinite;
  animation-iteration-count: infinite;
  -webkit-animation-timing-function: linear;
  animation-timing-function: linear;
  }
  .circle-container .circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  mix-blend-mode: screen;
  background-image: radial-gradient(#99ffff, #99ffff 10%, rgba(153, 255, 255, 0) 56%);
  -webkit-animation: fadein-frames 200ms infinite, scale-frames 2s infinite;
  animation: fadein-frames 200ms infinite, scale-frames 2s infinite;
  }
  @-webkit-keyframes fade-frames {
  0% {
  opacity: 1;
  }
  50% {
  opacity: 0.7;
  }
  100% {
  opacity: 1;
  }
  }
  @keyframes fade-frames {
  0% {
  opacity: 1;
  }
  50% {
  opacity: 0.7;
  }
  100% {
  opacity: 1;
  }
  }
  @-webkit-keyframes scale-frames {
  0% {
  -webkit-transform: scale3d(0.4, 0.4, 1);
    transform: scale3d(0.4, 0.4, 1);
  }
  50% {
  -webkit-transform: scale3d(2.2, 2.2, 1);
    transform: scale3d(2.2, 2.2, 1);
  }
  100% {
  -webkit-transform: scale3d(0.4, 0.4, 1);
    transform: scale3d(0.4, 0.4, 1);
  }
  }
  @keyframes scale-frames {
  0% {
  -webkit-transform: scale3d(0.4, 0.4, 1);
    transform: scale3d(0.4, 0.4, 1);
  }
  50% {
  -webkit-transform: scale3d(2.2, 2.2, 1);
    transform: scale3d(2.2, 2.2, 1);
  }
  100% {
  -webkit-transform: scale3d(0.4, 0.4, 1);
    transform: scale3d(0.4, 0.4, 1);
  }
  }
  .circle-container:nth-child(1) {
  width: 10px;
  height: 10px;
  -webkit-animation-name: move-frames-1;
  animation-name: move-frames-1;
  -webkit-animation-duration: 8441ms;
  animation-duration: 8441ms;
  -webkit-animation-delay: 4544ms;
  animation-delay: 4544ms;
  }
  @-webkit-keyframes move-frames-1 {
  from {
  -webkit-transform: translate3d(5vw, 12vh, 0);
    transform: translate3d(5vw, 12vh, 0);
  }
  to {
  -webkit-transform: translate3d(2vw, -17vh, 0);
    transform: translate3d(2vw, -17vh, 0);
  }
  }
  @keyframes move-frames-1 {
  from {
  -webkit-transform: translate3d(5vw, 12vh, 0);
    transform: translate3d(5vw, 12vh, 0);
  }
  to {
  -webkit-transform: translate3d(2vw, -17vh, 0);
    transform: translate3d(2vw, -17vh, 0);
  }
  }
  .circle-container:nth-child(1) .circle {
  -webkit-animation-delay: 3734ms;
  animation-delay: 3734ms;
  }
  .circle-container:nth-child(2) {
  width: 10px;
  height: 10px;
  -webkit-animation-name: move-frames-2;
  animation-name: move-frames-2;
  -webkit-animation-duration: 9921ms;
  animation-duration: 9921ms;
  -webkit-animation-delay: 5982ms;
  animation-delay: 5982ms;
  }
  @-webkit-keyframes move-frames-2 {
  from {
  -webkit-transform: translate3d(9vw, 18vh, 0);
    transform: translate3d(9vw, 18vh, 0);
  }
  to {
  -webkit-transform: translate3d(7vw, -13vh, 0);
    transform: translate3d(7vw, -13vh, 0);
  }
  }
  @keyframes move-frames-2 {
  from {
  -webkit-transform: translate3d(9vw, 18vh, 0);
    transform: translate3d(9vw, 10vh, 0);
  }
  to {
  -webkit-transform: translate3d(7vw, -12vh, 0);
    transform: translate3d(7vw, -12vh, 0);
  }
  }
  .circle-container:nth-child(2) .circle {
  -webkit-animation-delay: 2516ms;
  animation-delay: 2516ms;
  }
  .circle-container:nth-child(3) {
  width: 3px;
  height: 3px;
  -webkit-animation-name: move-frames-3;
  animation-name: move-frames-3;
  -webkit-animation-duration: 10427ms;
  animation-duration: 10427ms;
  -webkit-animation-delay: 3649ms;
  animation-delay: 3649ms;
  }
  @-webkit-keyframes move-frames-3 {
  from {
  -webkit-transform: translate3d(8vw, 10vh, 0);
    transform: translate3d(8vw, 10vh, 0);
  }
  to {
  -webkit-transform: translate3d(3vw, -13vh, 0);
    transform: translate3d(3vw, -13vh, 0);
  }
  }
  @keyframes move-frames-3 {
  from {
  -webkit-transform: translate3d(8vw, 10vh, 0);
    transform: translate3d(8vw, 10vh, 0);
  }
  to {
  -webkit-transform: translate3d(3vw, -13vh, 0);
    transform: translate3d(3vw, -13vh, 0);
  }
  }
  .circle-container:nth-child(3) .circle {
  -webkit-animation-delay: 731ms;
  animation-delay: 731ms;
  }
  .circle-container:nth-child(4) {
  width: 6px;
  height: 6px;
  -webkit-animation-name: move-frames-4;
  animation-name: move-frames-4;
  -webkit-animation-duration: 10951ms;
  animation-duration: 10951ms;
  -webkit-animation-delay: 8909ms;
  animation-delay: 8909ms;
  }
  @-webkit-keyframes move-frames-4 {
  from {
  -webkit-transform: translate3d(5vw, 10vh, 0);
    transform: translate3d(5vw, 10vh, 0);
  }
  to {
  -webkit-transform: translate3d(7vw, -12vh, 0);
    transform: translate3d(7vw, -12vh, 0);
  }
  }
  @keyframes move-frames-4 {
  from {
  -webkit-transform: translate3d(5vw, 10vh, 0);
    transform: translate3d(5vw, 10vh, 0);
  }
  to {
  -webkit-transform: translate3d(7vw, -12vh, 0);
    transform: translate3d(7vw, -12vh, 0);
  }
  }
  .circle-container:nth-child(4) .circle {
  -webkit-animation-delay: 2526ms;
  animation-delay: 2526ms;
  }
  .circle-container:nth-child(5) {
  width: 5px;
  height: 5px;
  -webkit-animation-name: move-frames-5;
  animation-name: move-frames-5;
  -webkit-animation-duration: 7642ms;
  animation-duration: 7642ms;
  -webkit-animation-delay: 2502ms;
  animation-delay: 2502ms;
  }
  @-webkit-keyframes move-frames-5 {
  from {
  -webkit-transform: translate3d(9vw, 10vh, 0);
    transform: translate3d(9vw, 10vh, 0);
  }
  to {
  -webkit-transform: translate3d(3vw, -12vh, 0);
    transform: translate3d(3vw, -12vh, 0);
  }
  }
  @keyframes move-frames-5 {
  from {
  -webkit-transform: translate3d(9vw, 10vh, 0);
    transform: translate3d(9vw, 10vh, 0);
  }
  to {
  -webkit-transform: translate3d(3vw, -12vh, 0);
    transform: translate3d(3vw, -12vh, 0);
  }
  }
  .circle-container:nth-child(5) .circle {
  -webkit-animation-delay: 2755ms;
  animation-delay: 2755ms;
  }
  .circle-container:nth-child(6) {
  width: 6px;
  height: 6px;
  -webkit-animation-name: move-frames-6;
  animation-name: move-frames-6;
  -webkit-animation-duration: 8439ms;
  animation-duration: 8439ms;
  -webkit-animation-delay: 455ms;
  animation-delay: 455ms;
  }
  @-webkit-keyframes move-frames-6 {
  from {
  -webkit-transform: translate3d(2vw, 10vh, 0);
    transform: translate3d(2vw, 10vh, 0);
  }
  to {
  -webkit-transform: translate3d(2vw, -10vh, 0);
    transform: translate3d(2vw, -10vh, 0);
  }
  }
  @keyframes move-frames-6 {
  from {
  -webkit-transform: translate3d(2vw, 10vh, 0);
    transform: translate3d(29vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(2vw, -10vh, 0);
    transform: translate3d(2vw, -10vh, 0);
  }
  }
  .circle-container:nth-child(6) .circle {
  -webkit-animation-delay: 3506ms;
  animation-delay: 3506ms;
  }
  .circle-container:nth-child(7) {
  width: 8px;
  height: 8px;
  -webkit-animation-name: move-frames-7;
  animation-name: move-frames-7;
  -webkit-animation-duration: 7539ms;
  animation-duration: 7539ms;
  -webkit-animation-delay: 3595ms;
  animation-delay: 3595ms;
  }
  @-webkit-keyframes move-frames-7 {
  from {
  -webkit-transform: translate3d(1vw, 10vh, 0);
    transform: translate3d(1vw, 10vh, 0);
  }
  to {
  -webkit-transform: translate3d(3vw, -12vh, 0);
    transform: translate3d(3vw, -12vh, 0);
  }
  }
  @keyframes move-frames-7 {
  from {
  -webkit-transform: translate3d(1vw, 10vh, 0);
    transform: translate3d(1vw, 10vh, 0);
  }
  to {
  -webkit-transform: translate3d(3vw, -12vh, 0);
    transform: translate3d(3vw, -12vh, 0);
  }
  }
  .circle-container:nth-child(7) .circle {
  -webkit-animation-delay: 749ms;
  animation-delay: 749ms;
  }
  .circle-container:nth-child(8) {
  width: 4px;
  height: 4px;
  -webkit-animation-name: move-frames-8;
  animation-name: move-frames-8;
  -webkit-animation-duration: 7480ms;
  animation-duration: 7480ms;
  -webkit-animation-delay: 2680ms;
  animation-delay: 2680ms;
  }
  @-webkit-keyframes move-frames-8 {
  from {
  -webkit-transform: translate3d(1vw, 10vh, 0);
    transform: translate3d(1vw, 10vh, 0);
  }
  to {
  -webkit-transform: translate3d(8vw, -11vh, 0);
    transform: translate3d(8vw, -11vh, 0);
  }
  }
  @keyframes move-frames-8 {
  from {
  -webkit-transform: translate3d(1vw, 10vh, 0);
    transform: translate3d(15vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(8vw, -11vh, 0);
    transform: translate3d(88vw, -111vh, 0);
  }
  }
  .circle-container:nth-child(8) .circle {
  -webkit-animation-delay: 1888ms;
  animation-delay: 1888ms;
  }
  .circle-container:nth-child(9) {
  width: 2px;
  height: 2px;
  -webkit-animation-name: move-frames-9;
  animation-name: move-frames-9;
  -webkit-animation-duration: 9087ms;
  animation-duration: 9087ms;
  -webkit-animation-delay: 9461ms;
  animation-delay: 9461ms;
  }
  @-webkit-keyframes move-frames-9 {
  from {
  -webkit-transform: translate3d(10vw, 10vh, 0);
    transform: translate3d(10vw, 10vh, 0);
  }
  to {
  -webkit-transform: translate3d(4vw, -13vh, 0);
    transform: translate3d(4vw, -13vh, 0);
  }
  }
  @keyframes move-frames-9 {
  from {
  -webkit-transform: translate3d(10vw, 10vh, 0);
    transform: translate3d(10vw, 10vh, 0);
  }
  to {
  -webkit-transform: translate3d(4vw, -13vh, 0);
    transform: translate3d(4vw, -13vh, 0);
  }
  }
  .circle-container:nth-child(9) .circle {
  -webkit-animation-delay: 1721ms;
  animation-delay: 1721ms;
  }
  .circle-container:nth-child(10) {
  width: 8px;
  height: 8px;
  -webkit-animation-name: move-frames-10;
  animation-name: move-frames-10;
  -webkit-animation-duration: 9860ms;
  animation-duration: 9860ms;
  -webkit-animation-delay: 8969ms;
  animation-delay: 8969ms;
  }
  @-webkit-keyframes move-frames-10 {
  from {
  -webkit-transform: translate3d(7vw, 11vh, 0);
    transform: translate3d(7vw, 11vh, 0);
  }
  to {
  -webkit-transform: translate3d(3vw, -12vh, 0);
    transform: translate3d(3vw, -12vh, 0);
  }
  }
  @keyframes move-frames-10 {
  from {
  -webkit-transform: translate3d(7vw, 11vh, 0);
    transform: translate3d(7vw, 11vh, 0);
  }
  to {
  -webkit-transform: translate3d(3vw, -12vh, 0);
    transform: translate3d(3vw, -12vh, 0);
  }
  }
  .circle-container:nth-child(10) .circle {
  -webkit-animation-delay: 1801ms;
  animation-delay: 1801ms;
  }
  .circle-container:nth-child(11) {
  width: 1px;
  height: 1px;
  -webkit-animation-name: move-frames-11;
  animation-name: move-frames-11;
  -webkit-animation-duration: 9292ms;
  animation-duration: 9292ms;
  -webkit-animation-delay: 9812ms;
  animation-delay: 9812ms;
  }
  @-webkit-keyframes move-frames-11 {
  from {
  -webkit-transform: translate3d(2vw, 10vh, 0);
    transform: translate3d(2vw, 10vh, 0);
  }
  to {
  -webkit-transform: translate3d(5vw, -13vh, 0);
    transform: translate3d(5vw, -13vh, 0);
  }
  }
  @keyframes move-frames-11 {
  from {
  -webkit-transform: translate3d(2vw, 10vh, 0);
    transform: translate3d(2vw, 10vh, 0);
  }
  to {
  -webkit-transform: translate3d(5vw, -13vh, 0);
    transform: translate3d(5vw, -13vh, 0);
  }
  }
  .circle-container:nth-child(11) .circle {
  -webkit-animation-delay: 3834ms;
  animation-delay: 3834ms;
  }
  .circle-container:nth-child(12) {
  width: 5px;
  height: 5px;
  -webkit-animation-name: move-frames-12;
  animation-name: move-frames-12;
  -webkit-animation-duration: 7920ms;
  animation-duration: 7920ms;
  -webkit-animation-delay: 2180ms;
  animation-delay: 2180ms;
  }
  @-webkit-keyframes move-frames-12 {
  from {
  -webkit-transform: translate3d(1vw, 10vh, 0);
    transform: translate3d(1vw, 10vh, 0);
  }
  to {
  -webkit-transform: translate3d(1vw, -12vh, 0);
    transform: translate3d(1vw, -12vh, 0);
  }
  }
  @keyframes move-frames-12 {
  from {
  -webkit-transform: translate3d(1vw, 10vh, 0);
    transform: translate3d(1vw, 10vh, 0);
  }
  to {
  -webkit-transform: translate3d(1vw, -12vh, 0);
    transform: translate3d(1vw, -12vh, 0);
  }
  }
  .circle-container:nth-child(12) .circle {
  -webkit-animation-delay: 1995ms;
  animation-delay: 1995ms;
  }
  .circle-container:nth-child(13) {
  width: 4px;
  height: 4px;
  -webkit-animation-name: move-frames-13;
  animation-name: move-frames-13;
  -webkit-animation-duration: 7293ms;
  animation-duration: 7293ms;
  -webkit-animation-delay: 6446ms;
  animation-delay: 6446ms;
  }
  @-webkit-keyframes move-frames-13 {
  from {
  -webkit-transform: translate3d(2vw, 10vh, 0);
    transform: translate3d(2vw, 10vh, 0);
  }
  to {
  -webkit-transform: translate3d(1vw, -12vh, 0);
    transform: translate3d(1vw, -12vh, 0);
  }
  }
  @keyframes move-frames-13 {
  from {
  -webkit-transform: translate3d(2vw, 10vh, 0);
    transform: translate3d(2vw, 10vh, 0);
  }
  to {
  -webkit-transform: translate3d(1vw, -12vh, 0);
    transform: translate3d(1vw, -12vh, 0);
  }
  }
  .circle-container:nth-child(13) .circle {
  -webkit-animation-delay: 1282ms;
  animation-delay: 1282ms;
  }
  .circle-container:nth-child(14) {
  width: 2px;
  height: 2px;
  -webkit-animation-name: move-frames-14;
  animation-name: move-frames-14;
  -webkit-animation-duration: 9677ms;
  animation-duration: 9677ms;
  -webkit-animation-delay: 5675ms;
  animation-delay: 5675ms;
  }
  @-webkit-keyframes move-frames-14 {
  from {
  -webkit-transform: translate3d(8.0vw, 10.2vh, 0);
    transform: translate3d(8.0vw, 10.2vh, 0);
  }
  to {
  -webkit-transform: translate3d(7.6vw, -11.0vh, 0);
    transform: translate3d(7.6vw, -11.0vh, 0);
  }
  }
  @keyframes move-frames-14 {
  from {
  -webkit-transform: translate3d(8.0vw, 10.2vh, 0);
    transform: translate3d(8.0vw, 10.2vh, 0);
  }
  to {
  -webkit-transform: translate3d(7.6vw, -11.0vh, 0);
    transform: translate3d(7.6vw, -11.0vh, 0);
  }
  }
  .circle-container:nth-child(14) .circle {
  -webkit-animation-delay: 542ms;
  animation-delay: 542ms;
  }
  .circle-container:nth-child(15) {
  width: 8px;
  height: 8px;
  -webkit-animation-name: move-frames-15;
  animation-name: move-frames-15;
  -webkit-animation-duration: 8055ms;
  animation-duration: 8055ms;
  -webkit-animation-delay: 7418ms;
  animation-delay: 7418ms;
  }
  @-webkit-keyframes move-frames-15 {
  from {
  -webkit-transform: translate3d(.7vw, 10.3vh, 0);
    transform: translate3d(.7vw, 10.3vh, 0);
  }
  to {
  -webkit-transform: translate3d(10.0vw, -12.9vh, 0);
    transform: translate3d(10.0vw, -12.9vh, 0);
  }
  }
  @keyframes move-frames-15 {
  from {
  -webkit-transform: translate3d(.7vw, 10.3vh, 0);
    transform: translate3d(.7vw, 10.3vh, 0);
  }
  to {
  -webkit-transform: translate3d(10.0vw, -12.9vh, 0);
    transform: translate3d(10.0vw, -12.9vh, 0);
  }
  }
  .circle-container:nth-child(15) .circle {
  -webkit-animation-delay: 2100ms;
  animation-delay: 2100ms;
  }
  .circle-container:nth-child(16) {
  width: 4px;
  height: 4px;
  -webkit-animation-name: move-frames-16;
  animation-name: move-frames-16;
  -webkit-animation-duration: 9673ms;
  animation-duration: 9673ms;
  -webkit-animation-delay: 871ms;
  animation-delay: 871ms;
  }
  @-webkit-keyframes move-frames-16 {
  from {
  -webkit-transform: translate3d(5.8vw, 10.2vh, 0);
    transform: translate3d(5.8vw, 10.2vh, 0);
  }
  to {
  -webkit-transform: translate3d(8.6vw, -12.6vh, 0);
    transform: translate3d(8.6vw, -12.6vh, 0);
  }
  }
  @keyframes move-frames-16 {
  from {
  -webkit-transform: translate3d(5.8vw, 10.2vh, 0);
    transform: translate3d(5.8vw, 10.2vh, 0);
  }
  to {
  -webkit-transform: translate3d(8.6vw, -12.6vh, 0);
    transform: translate3d(8.6vw, -12.6vh, 0);
  }
  }
  .circle-container:nth-child(16) .circle {
  -webkit-animation-delay: 2783ms;
  animation-delay: 2783ms;
  }
  .circle-container:nth-child(17) {
  width: 1px;
  height: 1px;
  -webkit-animation-name: move-frames-17;
  animation-name: move-frames-17;
  -webkit-animation-duration: 8468ms;
  animation-duration: 8468ms;
  -webkit-animation-delay: 2038ms;
  animation-delay: 2038ms;
  }
  @-webkit-keyframes move-frames-17 {
  from {
  -webkit-transform: translate3d(6.5vw, 10.8vh, 0);
    transform: translate3d(6.5vw, 10.8vh, 0);
  }
  to {
  -webkit-transform: translate3d(3.5vw, -13.4vh, 0);
    transform: translate3d(3.5vw, -13.4vh, 0);
  }
  }
  @keyframes move-frames-17 {
  from {
  -webkit-transform: translate3d(6.5vw, 10.8vh, 0);
    transform: translate3d(6.5vw, 10.8vh, 0);
  }
  to {
  -webkit-transform: translate3d(3.5vw, -13.4vh, 0);
    transform: translate3d(3.5vw, -13.4vh, 0);
  }
  }
  .circle-container:nth-child(17) .circle {
  -webkit-animation-delay: 346ms;
  animation-delay: 346ms;
  }
  .circle-container:nth-child(18) {
  width: 4px;
  height: 4px;
  -webkit-animation-name: move-frames-18;
  animation-name: move-frames-18;
  -webkit-animation-duration: 9523ms;
  animation-duration: 9523ms;
  -webkit-animation-delay: 2150ms;
  animation-delay: 2150ms;
  }
  @-webkit-keyframes move-frames-18 {
  from {
  -webkit-transform: translate3d(48vw, 102vh, 0);
    transform: translate3d(48vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(97vw, -127vh, 0);
    transform: translate3d(97vw, -127vh, 0);
  }
  }
  @keyframes move-frames-18 {
  from {
  -webkit-transform: translate3d(48vw, 102vh, 0);
    transform: translate3d(48vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(97vw, -127vh, 0);
    transform: translate3d(97vw, -127vh, 0);
  }
  }
  .circle-container:nth-child(18) .circle {
  -webkit-animation-delay: 2065ms;
  animation-delay: 2065ms;
  }
  .circle-container:nth-child(19) {
  width: 5px;
  height: 5px;
  -webkit-animation-name: move-frames-19;
  animation-name: move-frames-19;
  -webkit-animation-duration: 9472ms;
  animation-duration: 9472ms;
  -webkit-animation-delay: 428ms;
  animation-delay: 428ms;
  }
  @-webkit-keyframes move-frames-19 {
  from {
  -webkit-transform: translate3d(63vw, 107vh, 0);
    transform: translate3d(63vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(39vw, -122vh, 0);
    transform: translate3d(39vw, -122vh, 0);
  }
  }
  @keyframes move-frames-19 {
  from {
  -webkit-transform: translate3d(63vw, 107vh, 0);
    transform: translate3d(63vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(39vw, -122vh, 0);
    transform: translate3d(39vw, -122vh, 0);
  }
  }
  .circle-container:nth-child(19) .circle {
  -webkit-animation-delay: 2105ms;
  animation-delay: 2105ms;
  }
  .circle-container:nth-child(20) {
  width: 4px;
  height: 4px;
  -webkit-animation-name: move-frames-20;
  animation-name: move-frames-20;
  -webkit-animation-duration: 10290ms;
  animation-duration: 10290ms;
  -webkit-animation-delay: 8685ms;
  animation-delay: 8685ms;
  }
  @-webkit-keyframes move-frames-20 {
  from {
  -webkit-transform: translate3d(39vw, 106vh, 0);
    transform: translate3d(39vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(21vw, -128vh, 0);
    transform: translate3d(21vw, -128vh, 0);
  }
  }
  @keyframes move-frames-20 {
  from {
  -webkit-transform: translate3d(39vw, 106vh, 0);
    transform: translate3d(39vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(21vw, -128vh, 0);
    transform: translate3d(21vw, -128vh, 0);
  }
  }
  .circle-container:nth-child(20) .circle {
  -webkit-animation-delay: 246ms;
  animation-delay: 246ms;
  }
  .circle-container:nth-child(21) {
  width: 6px;
  height: 6px;
  -webkit-animation-name: move-frames-21;
  animation-name: move-frames-21;
  -webkit-animation-duration: 8708ms;
  animation-duration: 8708ms;
  -webkit-animation-delay: 2550ms;
  animation-delay: 2550ms;
  }
  @-webkit-keyframes move-frames-21 {
  from {
  -webkit-transform: translate3d(55vw, 110vh, 0);
    transform: translate3d(55vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(60vw, -112vh, 0);
    transform: translate3d(60vw, -112vh, 0);
  }
  }
  @keyframes move-frames-21 {
  from {
  -webkit-transform: translate3d(55vw, 110vh, 0);
    transform: translate3d(55vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(60vw, -112vh, 0);
    transform: translate3d(60vw, -112vh, 0);
  }
  }
  .circle-container:nth-child(21) .circle {
  -webkit-animation-delay: 3603ms;
  animation-delay: 3603ms;
  }
  .circle-container:nth-child(22) {
  width: 4px;
  height: 4px;
  -webkit-animation-name: move-frames-22;
  animation-name: move-frames-22;
  -webkit-animation-duration: 8465ms;
  animation-duration: 8465ms;
  -webkit-animation-delay: 2241ms;
  animation-delay: 2241ms;
  }
  @-webkit-keyframes move-frames-22 {
  from {
  -webkit-transform: translate3d(14vw, 110vh, 0);
    transform: translate3d(14vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(37vw, -128vh, 0);
    transform: translate3d(37vw, -128vh, 0);
  }
  }
  @keyframes move-frames-22 {
  from {
  -webkit-transform: translate3d(14vw, 110vh, 0);
    transform: translate3d(14vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(37vw, -128vh, 0);
    transform: translate3d(37vw, -128vh, 0);
  }
  }
  .circle-container:nth-child(22) .circle {
  -webkit-animation-delay: 3872ms;
  animation-delay: 3872ms;
  }
  .circle-container:nth-child(23) {
  width: 2px;
  height: 2px;
  -webkit-animation-name: move-frames-23;
  animation-name: move-frames-23;
  -webkit-animation-duration: 10859ms;
  animation-duration: 10859ms;
  -webkit-animation-delay: 7216ms;
  animation-delay: 7216ms;
  }
  @-webkit-keyframes move-frames-23 {
  from {
  -webkit-transform: translate3d(68vw, 105vh, 0);
    transform: translate3d(68vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(37vw, -128vh, 0);
    transform: translate3d(37vw, -128vh, 0);
  }
  }
  @keyframes move-frames-23 {
  from {
  -webkit-transform: translate3d(68vw, 105vh, 0);
    transform: translate3d(68vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(37vw, -128vh, 0);
    transform: translate3d(37vw, -128vh, 0);
  }
  }
  .circle-container:nth-child(23) .circle {
  -webkit-animation-delay: 3342ms;
  animation-delay: 3342ms;
  }
  .circle-container:nth-child(24) {
  width: 1px;
  height: 1px;
  -webkit-animation-name: move-frames-24;
  animation-name: move-frames-24;
  -webkit-animation-duration: 10469ms;
  animation-duration: 10469ms;
  -webkit-animation-delay: 6779ms;
  animation-delay: 6779ms;
  }
  @-webkit-keyframes move-frames-24 {
  from {
  -webkit-transform: translate3d(8vw, 102vh, 0);
    transform: translate3d(8vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(7vw, -118vh, 0);
    transform: translate3d(7vw, -118vh, 0);
  }
  }
  @keyframes move-frames-24 {
  from {
  -webkit-transform: translate3d(8vw, 102vh, 0);
    transform: translate3d(8vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(7vw, -118vh, 0);
    transform: translate3d(7vw, -118vh, 0);
  }
  }
  .circle-container:nth-child(24) .circle {
  -webkit-animation-delay: 3406ms;
  animation-delay: 3406ms;
  }
  .circle-container:nth-child(25) {
  width: 8px;
  height: 8px;
  -webkit-animation-name: move-frames-25;
  animation-name: move-frames-25;
  -webkit-animation-duration: 7010ms;
  animation-duration: 7010ms;
  -webkit-animation-delay: 7524ms;
  animation-delay: 7524ms;
  }
  @-webkit-keyframes move-frames-25 {
  from {
  -webkit-transform: translate3d(10vw, 109vh, 0);
    transform: translate3d(10vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(57vw, -132vh, 0);
    transform: translate3d(57vw, -132vh, 0);
  }
  }
  @keyframes move-frames-25 {
  from {
  -webkit-transform: translate3d(10vw, 109vh, 0);
    transform: translate3d(10vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(57vw, -132vh, 0);
    transform: translate3d(57vw, -132vh, 0);
  }
  }
  .circle-container:nth-child(25) .circle {
  -webkit-animation-delay: 3430ms;
  animation-delay: 3430ms;
  }
  .circle-container:nth-child(26) {
  width: 2px;
  height: 2px;
  -webkit-animation-name: move-frames-26;
  animation-name: move-frames-26;
  -webkit-animation-duration: 10471ms;
  animation-duration: 10471ms;
  -webkit-animation-delay: 1648ms;
  animation-delay: 1648ms;
  }
  @-webkit-keyframes move-frames-26 {
  from {
  -webkit-transform: translate3d(38vw, 104vh, 0);
    transform: translate3d(38vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(9vw, -116vh, 0);
    transform: translate3d(9vw, -116vh, 0);
  }
  }
  @keyframes move-frames-26 {
  from {
  -webkit-transform: translate3d(38vw, 104vh, 0);
    transform: translate3d(38vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(9vw, -116vh, 0);
    transform: translate3d(9vw, -116vh, 0);
  }
  }
  .circle-container:nth-child(26) .circle {
  -webkit-animation-delay: 3602ms;
  animation-delay: 3602ms;
  }
  .circle-container:nth-child(27) {
  width: 5px;
  height: 5px;
  -webkit-animation-name: move-frames-27;
  animation-name: move-frames-27;
  -webkit-animation-duration: 7423ms;
  animation-duration: 7423ms;
  -webkit-animation-delay: 5797ms;
  animation-delay: 5797ms;
  }
  @-webkit-keyframes move-frames-27 {
  from {
  -webkit-transform: translate3d(24vw, 107vh, 0);
    transform: translate3d(24vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(78vw, -109vh, 0);
    transform: translate3d(78vw, -109vh, 0);
  }
  }
  @keyframes move-frames-27 {
  from {
  -webkit-transform: translate3d(24vw, 107vh, 0);
    transform: translate3d(24vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(78vw, -109vh, 0);
    transform: translate3d(78vw, -109vh, 0);
  }
  }
  .circle-container:nth-child(27) .circle {
  -webkit-animation-delay: 3981ms;
  animation-delay: 3981ms;
  }
  .circle-container:nth-child(28) {
  width: 1px;
  height: 1px;
  -webkit-animation-name: move-frames-28;
  animation-name: move-frames-28;
  -webkit-animation-duration: 10775ms;
  animation-duration: 10775ms;
  -webkit-animation-delay: 10637ms;
  animation-delay: 10637ms;
  }
  @-webkit-keyframes move-frames-28 {
  from {
  -webkit-transform: translate3d(91vw, 108vh, 0);
    transform: translate3d(91vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(85vw, -111vh, 0);
    transform: translate3d(85vw, -111vh, 0);
  }
  }
  @keyframes move-frames-28 {
  from {
  -webkit-transform: translate3d(91vw, 108vh, 0);
    transform: translate3d(91vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(85vw, -111vh, 0);
    transform: translate3d(85vw, -111vh, 0);
  }
  }
  .circle-container:nth-child(28) .circle {
  -webkit-animation-delay: 487ms;
  animation-delay: 487ms;
  }
  .circle-container:nth-child(29) {
  width: 6px;
  height: 6px;
  -webkit-animation-name: move-frames-29;
  animation-name: move-frames-29;
  -webkit-animation-duration: 10713ms;
  animation-duration: 10713ms;
  -webkit-animation-delay: 1330ms;
  animation-delay: 1330ms;
  }
  @-webkit-keyframes move-frames-29 {
  from {
  -webkit-transform: translate3d(68vw, 109vh, 0);
    transform: translate3d(68vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(87vw, -122vh, 0);
    transform: translate3d(87vw, -122vh, 0);
  }
  }
  @keyframes move-frames-29 {
  from {
  -webkit-transform: translate3d(68vw, 109vh, 0);
    transform: translate3d(68vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(87vw, -122vh, 0);
    transform: translate3d(87vw, -122vh, 0);
  }
  }
  .circle-container:nth-child(29) .circle {
  -webkit-animation-delay: 3338ms;
  animation-delay: 3338ms;
  }
  .circle-container:nth-child(30) {
  width: 10px;
  height: 10px;
  -webkit-animation-name: move-frames-30;
  animation-name: move-frames-30;
  -webkit-animation-duration: 8127ms;
  animation-duration: 8127ms;
  -webkit-animation-delay: 10773ms;
  animation-delay: 10773ms;
  }
  @-webkit-keyframes move-frames-30 {
  from {
  -webkit-transform: translate3d(66vw, 101vh, 0);
    transform: translate3d(66vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(19vw, -113vh, 0);
    transform: translate3d(19vw, -113vh, 0);
  }
  }
  @keyframes move-frames-30 {
  from {
  -webkit-transform: translate3d(66vw, 101vh, 0);
    transform: translate3d(66vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(19vw, -113vh, 0);
    transform: translate3d(19vw, -113vh, 0);
  }
  }
  .circle-container:nth-child(30) .circle {
  -webkit-animation-delay: 967ms;
  animation-delay: 967ms;
  }
  .circle-container:nth-child(31) {
  width: 1px;
  height: 1px;
  -webkit-animation-name: move-frames-31;
  animation-name: move-frames-31;
  -webkit-animation-duration: 10070ms;
  animation-duration: 10070ms;
  -webkit-animation-delay: 1791ms;
  animation-delay: 1791ms;
  }
  @-webkit-keyframes move-frames-31 {
  from {
  -webkit-transform: translate3d(13vw, 104vh, 0);
    transform: translate3d(13vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(42vw, -117vh, 0);
    transform: translate3d(42vw, -117vh, 0);
  }
  }
  @keyframes move-frames-31 {
  from {
  -webkit-transform: translate3d(13vw, 104vh, 0);
    transform: translate3d(13vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(42vw, -117vh, 0);
    transform: translate3d(42vw, -117vh, 0);
  }
  }
  .circle-container:nth-child(31) .circle {
  -webkit-animation-delay: 758ms;
  animation-delay: 758ms;
  }
  .circle-container:nth-child(32) {
  width: 5px;
  height: 5px;
  -webkit-animation-name: move-frames-32;
  animation-name: move-frames-32;
  -webkit-animation-duration: 8451ms;
  animation-duration: 8451ms;
  -webkit-animation-delay: 6828ms;
  animation-delay: 6828ms;
  }
  @-webkit-keyframes move-frames-32 {
  from {
  -webkit-transform: translate3d(27vw, 101vh, 0);
    transform: translate3d(27vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(54vw, -120vh, 0);
    transform: translate3d(54vw, -120vh, 0);
  }
  }
  @keyframes move-frames-32 {
  from {
  -webkit-transform: translate3d(27vw, 101vh, 0);
    transform: translate3d(27vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(54vw, -120vh, 0);
    transform: translate3d(54vw, -120vh, 0);
  }
  }
  .circle-container:nth-child(32) .circle {
  -webkit-animation-delay: 102ms;
  animation-delay: 102ms;
  }
  .circle-container:nth-child(33) {
  width: 3px;
  height: 3px;
  -webkit-animation-name: move-frames-33;
  animation-name: move-frames-33;
  -webkit-animation-duration: 8210ms;
  animation-duration: 8210ms;
  -webkit-animation-delay: 3585ms;
  animation-delay: 3585ms;
  }
  @-webkit-keyframes move-frames-33 {
  from {
  -webkit-transform: translate3d(26vw, 107vh, 0);
    transform: translate3d(26vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(94vw, -108vh, 0);
    transform: translate3d(94vw, -108vh, 0);
  }
  }
  @keyframes move-frames-33 {
  from {
  -webkit-transform: translate3d(26vw, 107vh, 0);
    transform: translate3d(26vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(94vw, -108vh, 0);
    transform: translate3d(94vw, -108vh, 0);
  }
  }
  .circle-container:nth-child(33) .circle {
  -webkit-animation-delay: 3895ms;
  animation-delay: 3895ms;
  }
  .circle-container:nth-child(34) {
  width: 2px;
  height: 2px;
  -webkit-animation-name: move-frames-34;
  animation-name: move-frames-34;
  -webkit-animation-duration: 10257ms;
  animation-duration: 10257ms;
  -webkit-animation-delay: 3610ms;
  animation-delay: 3610ms;
  }
  @-webkit-keyframes move-frames-34 {
  from {
  -webkit-transform: translate3d(87vw, 107vh, 0);
    transform: translate3d(87vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(90vw, -125vh, 0);
    transform: translate3d(90vw, -125vh, 0);
  }
  }
  @keyframes move-frames-34 {
  from {
  -webkit-transform: translate3d(87vw, 107vh, 0);
    transform: translate3d(87vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(90vw, -125vh, 0);
    transform: translate3d(90vw, -125vh, 0);
  }
  }
  .circle-container:nth-child(34) .circle {
  -webkit-animation-delay: 1663ms;
  animation-delay: 1663ms;
  }
  .circle-container:nth-child(35) {
  width: 1px;
  height: 1px;
  -webkit-animation-name: move-frames-35;
  animation-name: move-frames-35;
  -webkit-animation-duration: 9587ms;
  animation-duration: 9587ms;
  -webkit-animation-delay: 5481ms;
  animation-delay: 5481ms;
  }
  @-webkit-keyframes move-frames-35 {
  from {
  -webkit-transform: translate3d(10vw, 109vh, 0);
    transform: translate3d(10vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(11vw, -120vh, 0);
    transform: translate3d(11vw, -120vh, 0);
  }
  }
  @keyframes move-frames-35 {
  from {
  -webkit-transform: translate3d(10vw, 109vh, 0);
    transform: translate3d(10vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(11vw, -120vh, 0);
    transform: translate3d(11vw, -120vh, 0);
  }
  }
  .circle-container:nth-child(35) .circle {
  -webkit-animation-delay: 1846ms;
  animation-delay: 1846ms;
  }
  .circle-container:nth-child(36) {
  width: 8px;
  height: 8px;
  -webkit-animation-name: move-frames-36;
  animation-name: move-frames-36;
  -webkit-animation-duration: 9067ms;
  animation-duration: 9067ms;
  -webkit-animation-delay: 6362ms;
  animation-delay: 6362ms;
  }
  @-webkit-keyframes move-frames-36 {
  from {
  -webkit-transform: translate3d(76vw, 106vh, 0);
    transform: translate3d(76vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(8vw, -114vh, 0);
    transform: translate3d(8vw, -114vh, 0);
  }
  }
  @keyframes move-frames-36 {
  from {
  -webkit-transform: translate3d(76vw, 106vh, 0);
    transform: translate3d(76vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(8vw, -114vh, 0);
    transform: translate3d(8vw, -114vh, 0);
  }
  }
  .circle-container:nth-child(36) .circle {
  -webkit-animation-delay: 629ms;
  animation-delay: 629ms;
  }
  .circle-container:nth-child(37) {
  width: 7px;
  height: 7px;
  -webkit-animation-name: move-frames-37;
  animation-name: move-frames-37;
  -webkit-animation-duration: 10464ms;
  animation-duration: 10464ms;
  -webkit-animation-delay: 459ms;
  animation-delay: 459ms;
  }
  @-webkit-keyframes move-frames-37 {
  from {
  -webkit-transform: translate3d(87vw, 106vh, 0);
    transform: translate3d(87vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(19vw, -111vh, 0);
    transform: translate3d(19vw, -111vh, 0);
  }
  }
  @keyframes move-frames-37 {
  from {
  -webkit-transform: translate3d(87vw, 106vh, 0);
    transform: translate3d(87vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(19vw, -111vh, 0);
    transform: translate3d(19vw, -111vh, 0);
  }
  }
  .circle-container:nth-child(37) .circle {
  -webkit-animation-delay: 2923ms;
  animation-delay: 2923ms;
  }
  .circle-container:nth-child(38) {
  width: 7px;
  height: 7px;
  -webkit-animation-name: move-frames-38;
  animation-name: move-frames-38;
  -webkit-animation-duration: 7636ms;
  animation-duration: 7636ms;
  -webkit-animation-delay: 7001ms;
  animation-delay: 7001ms;
  }
  @-webkit-keyframes move-frames-38 {
  from {
  -webkit-transform: translate3d(5vw, 106vh, 0);
    transform: translate3d(5vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(6vw, -110vh, 0);
    transform: translate3d(6vw, -110vh, 0);
  }
  }
  @keyframes move-frames-38 {
  from {
  -webkit-transform: translate3d(5vw, 106vh, 0);
    transform: translate3d(5vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(6vw, -110vh, 0);
    transform: translate3d(6vw, -110vh, 0);
  }
  }
  .circle-container:nth-child(38) .circle {
  -webkit-animation-delay: 2952ms;
  animation-delay: 2952ms;
  }
  .circle-container:nth-child(39) {
  width: 4px;
  height: 4px;
  -webkit-animation-name: move-frames-39;
  animation-name: move-frames-39;
  -webkit-animation-duration: 7141ms;
  animation-duration: 7141ms;
  -webkit-animation-delay: 7364ms;
  animation-delay: 7364ms;
  }
  @-webkit-keyframes move-frames-39 {
  from {
  -webkit-transform: translate3d(40vw, 101vh, 0);
    transform: translate3d(40vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(60vw, -114vh, 0);
    transform: translate3d(60vw, -114vh, 0);
  }
  }
  @keyframes move-frames-39 {
  from {
  -webkit-transform: translate3d(40vw, 101vh, 0);
    transform: translate3d(40vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(60vw, -114vh, 0);
    transform: translate3d(60vw, -114vh, 0);
  }
  }
  .circle-container:nth-child(39) .circle {
  -webkit-animation-delay: 2547ms;
  animation-delay: 2547ms;
  }
  .circle-container:nth-child(40) {
  width: 2px;
  height: 2px;
  -webkit-animation-name: move-frames-40;
  animation-name: move-frames-40;
  -webkit-animation-duration: 8810ms;
  animation-duration: 8810ms;
  -webkit-animation-delay: 2995ms;
  animation-delay: 2995ms;
  }
  @-webkit-keyframes move-frames-40 {
  from {
  -webkit-transform: translate3d(97vw, 104vh, 0);
    transform: translate3d(97vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(67vw, -119vh, 0);
    transform: translate3d(67vw, -119vh, 0);
  }
  }
  @keyframes move-frames-40 {
  from {
  -webkit-transform: translate3d(97vw, 104vh, 0);
    transform: translate3d(97vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(67vw, -119vh, 0);
    transform: translate3d(67vw, -119vh, 0);
  }
  }
  .circle-container:nth-child(40) .circle {
  -webkit-animation-delay: 2456ms;
  animation-delay: 2456ms;
  }
  .circle-container:nth-child(41) {
  width: 8px;
  height: 8px;
  -webkit-animation-name: move-frames-41;
  animation-name: move-frames-41;
  -webkit-animation-duration: 9821ms;
  animation-duration: 9821ms;
  -webkit-animation-delay: 6398ms;
  animation-delay: 6398ms;
  }
  @-webkit-keyframes move-frames-41 {
  from {
  -webkit-transform: translate3d(21vw, 104vh, 0);
    transform: translate3d(21vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(71vw, -129vh, 0);
    transform: translate3d(71vw, -129vh, 0);
  }
  }
  @keyframes move-frames-41 {
  from {
  -webkit-transform: translate3d(21vw, 104vh, 0);
    transform: translate3d(21vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(71vw, -129vh, 0);
    transform: translate3d(71vw, -129vh, 0);
  }
  }
  .circle-container:nth-child(41) .circle {
  -webkit-animation-delay: 3442ms;
  animation-delay: 3442ms;
  }
  .circle-container:nth-child(42) {
  width: 2px;
  height: 2px;
  -webkit-animation-name: move-frames-42;
  animation-name: move-frames-42;
  -webkit-animation-duration: 8587ms;
  animation-duration: 8587ms;
  -webkit-animation-delay: 9325ms;
  animation-delay: 9325ms;
  }
  @-webkit-keyframes move-frames-42 {
  from {
  -webkit-transform: translate3d(56vw, 109vh, 0);
    transform: translate3d(56vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(19vw, -110vh, 0);
    transform: translate3d(19vw, -110vh, 0);
  }
  }
  @keyframes move-frames-42 {
  from {
  -webkit-transform: translate3d(56vw, 109vh, 0);
    transform: translate3d(56vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(19vw, -110vh, 0);
    transform: translate3d(19vw, -110vh, 0);
  }
  }
  .circle-container:nth-child(42) .circle {
  -webkit-animation-delay: 1786ms;
  animation-delay: 1786ms;
  }
  .circle-container:nth-child(43) {
  width: 2px;
  height: 2px;
  -webkit-animation-name: move-frames-43;
  animation-name: move-frames-43;
  -webkit-animation-duration: 9314ms;
  animation-duration: 9314ms;
  -webkit-animation-delay: 2538ms;
  animation-delay: 2538ms;
  }
  @-webkit-keyframes move-frames-43 {
  from {
  -webkit-transform: translate3d(77vw, 101vh, 0);
    transform: translate3d(77vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(21vw, -123vh, 0);
    transform: translate3d(21vw, -123vh, 0);
  }
  }
  @keyframes move-frames-43 {
  from {
  -webkit-transform: translate3d(77vw, 101vh, 0);
    transform: translate3d(77vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(21vw, -123vh, 0);
    transform: translate3d(21vw, -123vh, 0);
  }
  }
  .circle-container:nth-child(43) .circle {
  -webkit-animation-delay: 278ms;
  animation-delay: 278ms;
  }
  .circle-container:nth-child(44) {
  width: 3px;
  height: 3px;
  -webkit-animation-name: move-frames-44;
  animation-name: move-frames-44;
  -webkit-animation-duration: 10350ms;
  animation-duration: 10350ms;
  -webkit-animation-delay: 1400ms;
  animation-delay: 1400ms;
  }
  @-webkit-keyframes move-frames-44 {
  from {
  -webkit-transform: translate3d(70vw, 108vh, 0);
    transform: translate3d(70vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(35vw, -128vh, 0);
    transform: translate3d(35vw, -128vh, 0);
  }
  }
  @keyframes move-frames-44 {
  from {
  -webkit-transform: translate3d(70vw, 108vh, 0);
    transform: translate3d(70vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(35vw, -128vh, 0);
    transform: translate3d(35vw, -128vh, 0);
  }
  }
  .circle-container:nth-child(44) .circle {
  -webkit-animation-delay: 1914ms;
  animation-delay: 1914ms;
  }
  .circle-container:nth-child(45) {
  width: 9px;
  height: 9px;
  -webkit-animation-name: move-frames-45;
  animation-name: move-frames-45;
  -webkit-animation-duration: 8763ms;
  animation-duration: 8763ms;
  -webkit-animation-delay: 9612ms;
  animation-delay: 9612ms;
  }
  @-webkit-keyframes move-frames-45 {
  from {
  -webkit-transform: translate3d(10vw, 105vh, 0);
    transform: translate3d(10vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(47vw, -122vh, 0);
    transform: translate3d(47vw, -122vh, 0);
  }
  }
  @keyframes move-frames-45 {
  from {
  -webkit-transform: translate3d(10vw, 105vh, 0);
    transform: translate3d(10vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(47vw, -122vh, 0);
    transform: translate3d(47vw, -122vh, 0);
  }
  }
  .circle-container:nth-child(45) .circle {
  -webkit-animation-delay: 489ms;
  animation-delay: 489ms;
  }
  .circle-container:nth-child(46) {
  width: 4px;
  height: 4px;
  -webkit-animation-name: move-frames-46;
  animation-name: move-frames-46;
  -webkit-animation-duration: 8664ms;
  animation-duration: 8664ms;
  -webkit-animation-delay: 2027ms;
  animation-delay: 2027ms;
  }
  @-webkit-keyframes move-frames-46 {
  from {
  -webkit-transform: translate3d(12vw, 107vh, 0);
    transform: translate3d(12vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(50vw, -129vh, 0);
    transform: translate3d(50vw, -129vh, 0);
  }
  }
  @keyframes move-frames-46 {
  from {
  -webkit-transform: translate3d(12vw, 107vh, 0);
    transform: translate3d(12vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(50vw, -129vh, 0);
    transform: translate3d(50vw, -129vh, 0);
  }
  }
  .circle-container:nth-child(46) .circle {
  -webkit-animation-delay: 3695ms;
  animation-delay: 3695ms;
  }
  .circle-container:nth-child(47) {
  width: 3px;
  height: 3px;
  -webkit-animation-name: move-frames-47;
  animation-name: move-frames-47;
  -webkit-animation-duration: 7560ms;
  animation-duration: 7560ms;
  -webkit-animation-delay: 1148ms;
  animation-delay: 1148ms;
  }
  @-webkit-keyframes move-frames-47 {
  from {
  -webkit-transform: translate3d(19vw, 109vh, 0);
    transform: translate3d(19vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(64vw, -132vh, 0);
    transform: translate3d(64vw, -132vh, 0);
  }
  }
  @keyframes move-frames-47 {
  from {
  -webkit-transform: translate3d(19vw, 109vh, 0);
    transform: translate3d(19vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(64vw, -132vh, 0);
    transform: translate3d(64vw, -132vh, 0);
  }
  }
  .circle-container:nth-child(47) .circle {
  -webkit-animation-delay: 2281ms;
  animation-delay: 2281ms;
  }
  .circle-container:nth-child(48) {
  width: 9px;
  height: 9px;
  -webkit-animation-name: move-frames-48;
  animation-name: move-frames-48;
  -webkit-animation-duration: 8113ms;
  animation-duration: 8113ms;
  -webkit-animation-delay: 10176ms;
  animation-delay: 10176ms;
  }
  @-webkit-keyframes move-frames-48 {
  from {
  -webkit-transform: translate3d(71vw, 102vh, 0);
    transform: translate3d(71vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(59vw, -130vh, 0);
    transform: translate3d(59vw, -130vh, 0);
  }
  }
  @keyframes move-frames-48 {
  from {
  -webkit-transform: translate3d(71vw, 102vh, 0);
    transform: translate3d(71vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(59vw, -130vh, 0);
    transform: translate3d(59vw, -130vh, 0);
  }
  }
  .circle-container:nth-child(48) .circle {
  -webkit-animation-delay: 2287ms;
  animation-delay: 2287ms;
  }
  .circle-container:nth-child(49) {
  width: 7px;
  height: 7px;
  -webkit-animation-name: move-frames-49;
  animation-name: move-frames-49;
  -webkit-animation-duration: 8320ms;
  animation-duration: 8320ms;
  -webkit-animation-delay: 6863ms;
  animation-delay: 6863ms;
  }
  @-webkit-keyframes move-frames-49 {
  from {
  -webkit-transform: translate3d(44vw, 106vh, 0);
    transform: translate3d(44vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(92vw, -110vh, 0);
    transform: translate3d(92vw, -110vh, 0);
  }
  }
  @keyframes move-frames-49 {
  from {
  -webkit-transform: translate3d(44vw, 106vh, 0);
    transform: translate3d(44vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(92vw, -110vh, 0);
    transform: translate3d(92vw, -110vh, 0);
  }
  }
  .circle-container:nth-child(49) .circle {
  -webkit-animation-delay: 2657ms;
  animation-delay: 2657ms;
  }
  .circle-container:nth-child(50) {
  width: 2px;
  height: 2px;
  -webkit-animation-name: move-frames-50;
  animation-name: move-frames-50;
  -webkit-animation-duration: 10040ms;
  animation-duration: 10040ms;
  -webkit-animation-delay: 5659ms;
  animation-delay: 5659ms;
  }
  @-webkit-keyframes move-frames-50 {
  from {
  -webkit-transform: translate3d(91vw, 106vh, 0);
    transform: translate3d(91vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(7vw, -127vh, 0);
    transform: translate3d(7vw, -127vh, 0);
  }
  }
  @keyframes move-frames-50 {
  from {
  -webkit-transform: translate3d(91vw, 106vh, 0);
    transform: translate3d(91vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(7vw, -127vh, 0);
    transform: translate3d(7vw, -127vh, 0);
  }
  }
  .circle-container:nth-child(50) .circle {
  -webkit-animation-delay: 305ms;
  animation-delay: 305ms;
  }
  .circle-container:nth-child(51) {
  width: 7px;
  height: 7px;
  -webkit-animation-name: move-frames-51;
  animation-name: move-frames-51;
  -webkit-animation-duration: 7733ms;
  animation-duration: 7733ms;
  -webkit-animation-delay: 3199ms;
  animation-delay: 3199ms;
  }
  @-webkit-keyframes move-frames-51 {
  from {
  -webkit-transform: translate3d(18vw, 101vh, 0);
    transform: translate3d(18vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(44vw, -118vh, 0);
    transform: translate3d(44vw, -118vh, 0);
  }
  }
  @keyframes move-frames-51 {
  from {
  -webkit-transform: translate3d(18vw, 101vh, 0);
    transform: translate3d(18vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(44vw, -118vh, 0);
    transform: translate3d(44vw, -118vh, 0);
  }
  }
  .circle-container:nth-child(51) .circle {
  -webkit-animation-delay: 2575ms;
  animation-delay: 2575ms;
  }
  .circle-container:nth-child(52) {
  width: 6px;
  height: 6px;
  -webkit-animation-name: move-frames-52;
  animation-name: move-frames-52;
  -webkit-animation-duration: 9205ms;
  animation-duration: 9205ms;
  -webkit-animation-delay: 3615ms;
  animation-delay: 3615ms;
  }
  @-webkit-keyframes move-frames-52 {
  from {
  -webkit-transform: translate3d(75vw, 108vh, 0);
    transform: translate3d(75vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(73vw, -126vh, 0);
    transform: translate3d(73vw, -126vh, 0);
  }
  }
  @keyframes move-frames-52 {
  from {
  -webkit-transform: translate3d(75vw, 108vh, 0);
    transform: translate3d(75vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(73vw, -126vh, 0);
    transform: translate3d(73vw, -126vh, 0);
  }
  }
  .circle-container:nth-child(52) .circle {
  -webkit-animation-delay: 3111ms;
  animation-delay: 3111ms;
  }
  .circle-container:nth-child(53) {
  width: 1px;
  height: 1px;
  -webkit-animation-name: move-frames-53;
  animation-name: move-frames-53;
  -webkit-animation-duration: 9986ms;
  animation-duration: 9986ms;
  -webkit-animation-delay: 591ms;
  animation-delay: 591ms;
  }
  @-webkit-keyframes move-frames-53 {
  from {
  -webkit-transform: translate3d(12vw, 107vh, 0);
    transform: translate3d(12vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(60vw, -112vh, 0);
    transform: translate3d(60vw, -112vh, 0);
  }
  }
  @keyframes move-frames-53 {
  from {
  -webkit-transform: translate3d(12vw, 107vh, 0);
    transform: translate3d(12vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(60vw, -112vh, 0);
    transform: translate3d(60vw, -112vh, 0);
  }
  }
  .circle-container:nth-child(53) .circle {
  -webkit-animation-delay: 3881ms;
  animation-delay: 3881ms;
  }
  .circle-container:nth-child(54) {
  width: 5px;
  height: 5px;
  -webkit-animation-name: move-frames-54;
  animation-name: move-frames-54;
  -webkit-animation-duration: 7951ms;
  animation-duration: 7951ms;
  -webkit-animation-delay: 4744ms;
  animation-delay: 4744ms;
  }
  @-webkit-keyframes move-frames-54 {
  from {
  -webkit-transform: translate3d(2vw, 110vh, 0);
    transform: translate3d(2vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(38vw, -124vh, 0);
    transform: translate3d(38vw, -124vh, 0);
  }
  }
  @keyframes move-frames-54 {
  from {
  -webkit-transform: translate3d(2vw, 110vh, 0);
    transform: translate3d(2vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(38vw, -124vh, 0);
    transform: translate3d(38vw, -124vh, 0);
  }
  }
  .circle-container:nth-child(54) .circle {
  -webkit-animation-delay: 2891ms;
  animation-delay: 2891ms;
  }
  .circle-container:nth-child(55) {
  width: 4px;
  height: 4px;
  -webkit-animation-name: move-frames-55;
  animation-name: move-frames-55;
  -webkit-animation-duration: 10203ms;
  animation-duration: 10203ms;
  -webkit-animation-delay: 6172ms;
  animation-delay: 6172ms;
  }
  @-webkit-keyframes move-frames-55 {
  from {
  -webkit-transform: translate3d(58vw, 103vh, 0);
    transform: translate3d(58vw, 103vh, 0);
  }
  to {
  -webkit-transform: translate3d(66vw, -115vh, 0);
    transform: translate3d(66vw, -115vh, 0);
  }
  }
  @keyframes move-frames-55 {
  from {
  -webkit-transform: translate3d(58vw, 103vh, 0);
    transform: translate3d(58vw, 103vh, 0);
  }
  to {
  -webkit-transform: translate3d(66vw, -115vh, 0);
    transform: translate3d(66vw, -115vh, 0);
  }
  }
  .circle-container:nth-child(55) .circle {
  -webkit-animation-delay: 271ms;
  animation-delay: 271ms;
  }
  .circle-container:nth-child(56) {
  width: 1px;
  height: 1px;
  -webkit-animation-name: move-frames-56;
  animation-name: move-frames-56;
  -webkit-animation-duration: 8809ms;
  animation-duration: 8809ms;
  -webkit-animation-delay: 1972ms;
  animation-delay: 1972ms;
  }
  @-webkit-keyframes move-frames-56 {
  from {
  -webkit-transform: translate3d(1vw, 101vh, 0);
    transform: translate3d(1vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(87vw, -102vh, 0);
    transform: translate3d(87vw, -102vh, 0);
  }
  }
  @keyframes move-frames-56 {
  from {
  -webkit-transform: translate3d(1vw, 101vh, 0);
    transform: translate3d(1vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(87vw, -102vh, 0);
    transform: translate3d(87vw, -102vh, 0);
  }
  }
  .circle-container:nth-child(56) .circle {
  -webkit-animation-delay: 3175ms;
  animation-delay: 3175ms;
  }
  .circle-container:nth-child(57) {
  width: 7px;
  height: 7px;
  -webkit-animation-name: move-frames-57;
  animation-name: move-frames-57;
  -webkit-animation-duration: 8823ms;
  animation-duration: 8823ms;
  -webkit-animation-delay: 9617ms;
  animation-delay: 9617ms;
  }
  @-webkit-keyframes move-frames-57 {
  from {
  -webkit-transform: translate3d(81vw, 107vh, 0);
    transform: translate3d(81vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(68vw, -115vh, 0);
    transform: translate3d(68vw, -115vh, 0);
  }
  }
  @keyframes move-frames-57 {
  from {
  -webkit-transform: translate3d(81vw, 107vh, 0);
    transform: translate3d(81vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(68vw, -115vh, 0);
    transform: translate3d(68vw, -115vh, 0);
  }
  }
  .circle-container:nth-child(57) .circle {
  -webkit-animation-delay: 3929ms;
  animation-delay: 3929ms;
  }
  .circle-container:nth-child(58) {
  width: 2px;
  height: 2px;
  -webkit-animation-name: move-frames-58;
  animation-name: move-frames-58;
  -webkit-animation-duration: 10905ms;
  animation-duration: 10905ms;
  -webkit-animation-delay: 7747ms;
  animation-delay: 7747ms;
  }
  @-webkit-keyframes move-frames-58 {
  from {
  -webkit-transform: translate3d(54vw, 109vh, 0);
    transform: translate3d(54vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(26vw, -135vh, 0);
    transform: translate3d(26vw, -135vh, 0);
  }
  }
  @keyframes move-frames-58 {
  from {
  -webkit-transform: translate3d(54vw, 109vh, 0);
    transform: translate3d(54vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(26vw, -135vh, 0);
    transform: translate3d(26vw, -135vh, 0);
  }
  }
  .circle-container:nth-child(58) .circle {
  -webkit-animation-delay: 268ms;
  animation-delay: 268ms;
  }
  .circle-container:nth-child(59) {
  width: 1px;
  height: 1px;
  -webkit-animation-name: move-frames-59;
  animation-name: move-frames-59;
  -webkit-animation-duration: 8679ms;
  animation-duration: 8679ms;
  -webkit-animation-delay: 6838ms;
  animation-delay: 6838ms;
  }
  @-webkit-keyframes move-frames-59 {
  from {
  -webkit-transform: translate3d(93vw, 110vh, 0);
    transform: translate3d(93vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(56vw, -138vh, 0);
    transform: translate3d(56vw, -138vh, 0);
  }
  }
  @keyframes move-frames-59 {
  from {
  -webkit-transform: translate3d(93vw, 110vh, 0);
    transform: translate3d(93vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(56vw, -138vh, 0);
    transform: translate3d(56vw, -138vh, 0);
  }
  }
  .circle-container:nth-child(59) .circle {
  -webkit-animation-delay: 933ms;
  animation-delay: 933ms;
  }
  .circle-container:nth-child(60) {
  width: 6px;
  height: 6px;
  -webkit-animation-name: move-frames-60;
  animation-name: move-frames-60;
  -webkit-animation-duration: 10727ms;
  animation-duration: 10727ms;
  -webkit-animation-delay: 6300ms;
  animation-delay: 6300ms;
  }
  @-webkit-keyframes move-frames-60 {
  from {
  -webkit-transform: translate3d(31vw, 102vh, 0);
    transform: translate3d(31vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(3vw, -126vh, 0);
    transform: translate3d(3vw, -126vh, 0);
  }
  }
  @keyframes move-frames-60 {
  from {
  -webkit-transform: translate3d(31vw, 102vh, 0);
    transform: translate3d(31vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(3vw, -126vh, 0);
    transform: translate3d(3vw, -126vh, 0);
  }
  }
  .circle-container:nth-child(60) .circle {
  -webkit-animation-delay: 1802ms;
  animation-delay: 1802ms;
  }
  .circle-container:nth-child(61) {
  width: 7px;
  height: 7px;
  -webkit-animation-name: move-frames-61;
  animation-name: move-frames-61;
  -webkit-animation-duration: 7874ms;
  animation-duration: 7874ms;
  -webkit-animation-delay: 2384ms;
  animation-delay: 2384ms;
  }
  @-webkit-keyframes move-frames-61 {
  from {
  -webkit-transform: translate3d(87vw, 104vh, 0);
    transform: translate3d(87vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(92vw, -134vh, 0);
    transform: translate3d(92vw, -134vh, 0);
  }
  }
  @keyframes move-frames-61 {
  from {
  -webkit-transform: translate3d(87vw, 104vh, 0);
    transform: translate3d(87vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(92vw, -134vh, 0);
    transform: translate3d(92vw, -134vh, 0);
  }
  }
  .circle-container:nth-child(61) .circle {
  -webkit-animation-delay: 2326ms;
  animation-delay: 2326ms;
  }
  .circle-container:nth-child(62) {
  width: 2px;
  height: 2px;
  -webkit-animation-name: move-frames-62;
  animation-name: move-frames-62;
  -webkit-animation-duration: 9350ms;
  animation-duration: 9350ms;
  -webkit-animation-delay: 8693ms;
  animation-delay: 8693ms;
  }
  @-webkit-keyframes move-frames-62 {
  from {
  -webkit-transform: translate3d(36vw, 108vh, 0);
    transform: translate3d(36vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(76vw, -138vh, 0);
    transform: translate3d(76vw, -138vh, 0);
  }
  }
  @keyframes move-frames-62 {
  from {
  -webkit-transform: translate3d(36vw, 108vh, 0);
    transform: translate3d(36vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(76vw, -138vh, 0);
    transform: translate3d(76vw, -138vh, 0);
  }
  }
  .circle-container:nth-child(62) .circle {
  -webkit-animation-delay: 2265ms;
  animation-delay: 2265ms;
  }
  .circle-container:nth-child(63) {
  width: 4px;
  height: 4px;
  -webkit-animation-name: move-frames-63;
  animation-name: move-frames-63;
  -webkit-animation-duration: 9490ms;
  animation-duration: 9490ms;
  -webkit-animation-delay: 8587ms;
  animation-delay: 8587ms;
  }
  @-webkit-keyframes move-frames-63 {
  from {
  -webkit-transform: translate3d(52vw, 102vh, 0);
    transform: translate3d(52vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(21vw, -113vh, 0);
    transform: translate3d(21vw, -113vh, 0);
  }
  }
  @keyframes move-frames-63 {
  from {
  -webkit-transform: translate3d(52vw, 102vh, 0);
    transform: translate3d(52vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(21vw, -113vh, 0);
    transform: translate3d(21vw, -113vh, 0);
  }
  }
  .circle-container:nth-child(63) .circle {
  -webkit-animation-delay: 3567ms;
  animation-delay: 3567ms;
  }
  .circle-container:nth-child(64) {
  width: 8px;
  height: 8px;
  -webkit-animation-name: move-frames-64;
  animation-name: move-frames-64;
  -webkit-animation-duration: 9062ms;
  animation-duration: 9062ms;
  -webkit-animation-delay: 859ms;
  animation-delay: 859ms;
  }
  @-webkit-keyframes move-frames-64 {
  from {
  -webkit-transform: translate3d(88vw, 105vh, 0);
    transform: translate3d(88vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(51vw, -125vh, 0);
    transform: translate3d(51vw, -125vh, 0);
  }
  }
  @keyframes move-frames-64 {
  from {
  -webkit-transform: translate3d(88vw, 105vh, 0);
    transform: translate3d(88vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(51vw, -125vh, 0);
    transform: translate3d(51vw, -125vh, 0);
  }
  }
  .circle-container:nth-child(64) .circle {
  -webkit-animation-delay: 1843ms;
  animation-delay: 1843ms;
  }
  .circle-container:nth-child(65) {
  width: 4px;
  height: 4px;
  -webkit-animation-name: move-frames-65;
  animation-name: move-frames-65;
  -webkit-animation-duration: 9967ms;
  animation-duration: 9967ms;
  -webkit-animation-delay: 2021ms;
  animation-delay: 2021ms;
  }
  @-webkit-keyframes move-frames-65 {
  from {
  -webkit-transform: translate3d(11vw, 110vh, 0);
    transform: translate3d(11vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(43vw, -116vh, 0);
    transform: translate3d(43vw, -116vh, 0);
  }
  }
  @keyframes move-frames-65 {
  from {
  -webkit-transform: translate3d(11vw, 110vh, 0);
    transform: translate3d(11vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(43vw, -116vh, 0);
    transform: translate3d(43vw, -116vh, 0);
  }
  }
  .circle-container:nth-child(65) .circle {
  -webkit-animation-delay: 258ms;
  animation-delay: 258ms;
  }
  .circle-container:nth-child(66) {
  width: 7px;
  height: 7px;
  -webkit-animation-name: move-frames-66;
  animation-name: move-frames-66;
  -webkit-animation-duration: 9722ms;
  animation-duration: 9722ms;
  -webkit-animation-delay: 1232ms;
  animation-delay: 1232ms;
  }
  @-webkit-keyframes move-frames-66 {
  from {
  -webkit-transform: translate3d(14vw, 104vh, 0);
    transform: translate3d(14vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(20vw, -124vh, 0);
    transform: translate3d(20vw, -124vh, 0);
  }
  }
  @keyframes move-frames-66 {
  from {
  -webkit-transform: translate3d(14vw, 104vh, 0);
    transform: translate3d(14vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(20vw, -124vh, 0);
    transform: translate3d(20vw, -124vh, 0);
  }
  }
  .circle-container:nth-child(66) .circle {
  -webkit-animation-delay: 1045ms;
  animation-delay: 1045ms;
  }
  .circle-container:nth-child(67) {
  width: 1px;
  height: 1px;
  -webkit-animation-name: move-frames-67;
  animation-name: move-frames-67;
  -webkit-animation-duration: 9866ms;
  animation-duration: 9866ms;
  -webkit-animation-delay: 2433ms;
  animation-delay: 2433ms;
  }
  @-webkit-keyframes move-frames-67 {
  from {
  -webkit-transform: translate3d(49vw, 105vh, 0);
    transform: translate3d(49vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(47vw, -117vh, 0);
    transform: translate3d(47vw, -117vh, 0);
  }
  }
  @keyframes move-frames-67 {
  from {
  -webkit-transform: translate3d(49vw, 105vh, 0);
    transform: translate3d(49vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(47vw, -117vh, 0);
    transform: translate3d(47vw, -117vh, 0);
  }
  }
  .circle-container:nth-child(67) .circle {
  -webkit-animation-delay: 2715ms;
  animation-delay: 2715ms;
  }
  .circle-container:nth-child(68) {
  width: 10px;
  height: 10px;
  -webkit-animation-name: move-frames-68;
  animation-name: move-frames-68;
  -webkit-animation-duration: 7814ms;
  animation-duration: 7814ms;
  -webkit-animation-delay: 8587ms;
  animation-delay: 8587ms;
  }
  @-webkit-keyframes move-frames-68 {
  from {
  -webkit-transform: translate3d(32vw, 103vh, 0);
    transform: translate3d(32vw, 103vh, 0);
  }
  to {
  -webkit-transform: translate3d(2vw, -116vh, 0);
    transform: translate3d(2vw, -116vh, 0);
  }
  }
  @keyframes move-frames-68 {
  from {
  -webkit-transform: translate3d(32vw, 103vh, 0);
    transform: translate3d(32vw, 103vh, 0);
  }
  to {
  -webkit-transform: translate3d(2vw, -116vh, 0);
    transform: translate3d(2vw, -116vh, 0);
  }
  }
  .circle-container:nth-child(68) .circle {
  -webkit-animation-delay: 1485ms;
  animation-delay: 1485ms;
  }
  .circle-container:nth-child(69) {
  width: 9px;
  height: 9px;
  -webkit-animation-name: move-frames-69;
  animation-name: move-frames-69;
  -webkit-animation-duration: 10708ms;
  animation-duration: 10708ms;
  -webkit-animation-delay: 2875ms;
  animation-delay: 2875ms;
  }
  @-webkit-keyframes move-frames-69 {
  from {
  -webkit-transform: translate3d(35vw, 104vh, 0);
    transform: translate3d(35vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(59vw, -132vh, 0);
    transform: translate3d(59vw, -132vh, 0);
  }
  }
  @keyframes move-frames-69 {
  from {
  -webkit-transform: translate3d(35vw, 104vh, 0);
    transform: translate3d(35vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(59vw, -132vh, 0);
    transform: translate3d(59vw, -132vh, 0);
  }
  }
  .circle-container:nth-child(69) .circle {
  -webkit-animation-delay: 418ms;
  animation-delay: 418ms;
  }
  .circle-container:nth-child(70) {
  width: 2px;
  height: 2px;
  -webkit-animation-name: move-frames-70;
  animation-name: move-frames-70;
  -webkit-animation-duration: 7155ms;
  animation-duration: 7155ms;
  -webkit-animation-delay: 7642ms;
  animation-delay: 7642ms;
  }
  @-webkit-keyframes move-frames-70 {
  from {
  -webkit-transform: translate3d(36vw, 109vh, 0);
    transform: translate3d(36vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(76vw, -111vh, 0);
    transform: translate3d(76vw, -111vh, 0);
  }
  }
  @keyframes move-frames-70 {
  from {
  -webkit-transform: translate3d(36vw, 109vh, 0);
    transform: translate3d(36vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(76vw, -111vh, 0);
    transform: translate3d(76vw, -111vh, 0);
  }
  }
  .circle-container:nth-child(70) .circle {
  -webkit-animation-delay: 3561ms;
  animation-delay: 3561ms;
  }
  .circle-container:nth-child(71) {
  width: 4px;
  height: 4px;
  -webkit-animation-name: move-frames-71;
  animation-name: move-frames-71;
  -webkit-animation-duration: 10435ms;
  animation-duration: 10435ms;
  -webkit-animation-delay: 4267ms;
  animation-delay: 4267ms;
  }
  @-webkit-keyframes move-frames-71 {
  from {
  -webkit-transform: translate3d(74vw, 105vh, 0);
    transform: translate3d(74vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(67vw, -128vh, 0);
    transform: translate3d(67vw, -128vh, 0);
  }
  }
  @keyframes move-frames-71 {
  from {
  -webkit-transform: translate3d(74vw, 105vh, 0);
    transform: translate3d(74vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(67vw, -128vh, 0);
    transform: translate3d(67vw, -128vh, 0);
  }
  }
  .circle-container:nth-child(71) .circle {
  -webkit-animation-delay: 2186ms;
  animation-delay: 2186ms;
  }
  .circle-container:nth-child(72) {
  width: 5px;
  height: 5px;
  -webkit-animation-name: move-frames-72;
  animation-name: move-frames-72;
  -webkit-animation-duration: 7478ms;
  animation-duration: 7478ms;
  -webkit-animation-delay: 5776ms;
  animation-delay: 5776ms;
  }
  @-webkit-keyframes move-frames-72 {
  from {
  -webkit-transform: translate3d(51vw, 110vh, 0);
    transform: translate3d(51vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(58vw, -116vh, 0);
    transform: translate3d(58vw, -116vh, 0);
  }
  }
  @keyframes move-frames-72 {
  from {
  -webkit-transform: translate3d(51vw, 110vh, 0);
    transform: translate3d(51vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(58vw, -116vh, 0);
    transform: translate3d(58vw, -116vh, 0);
  }
  }
  .circle-container:nth-child(72) .circle {
  -webkit-animation-delay: 1254ms;
  animation-delay: 1254ms;
  }
  .circle-container:nth-child(73) {
  width: 4px;
  height: 4px;
  -webkit-animation-name: move-frames-73;
  animation-name: move-frames-73;
  -webkit-animation-duration: 7309ms;
  animation-duration: 7309ms;
  -webkit-animation-delay: 10241ms;
  animation-delay: 10241ms;
  }
  @-webkit-keyframes move-frames-73 {
  from {
  -webkit-transform: translate3d(76vw, 105vh, 0);
    transform: translate3d(76vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(65vw, -125vh, 0);
    transform: translate3d(65vw, -125vh, 0);
  }
  }
  @keyframes move-frames-73 {
  from {
  -webkit-transform: translate3d(76vw, 105vh, 0);
    transform: translate3d(76vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(65vw, -125vh, 0);
    transform: translate3d(65vw, -125vh, 0);
  }
  }
  .circle-container:nth-child(73) .circle {
  -webkit-animation-delay: 2095ms;
  animation-delay: 2095ms;
  }
  .circle-container:nth-child(74) {
  width: 1px;
  height: 1px;
  -webkit-animation-name: move-frames-74;
  animation-name: move-frames-74;
  -webkit-animation-duration: 10996ms;
  animation-duration: 10996ms;
  -webkit-animation-delay: 3358ms;
  animation-delay: 3358ms;
  }
  @-webkit-keyframes move-frames-74 {
  from {
  -webkit-transform: translate3d(32vw, 110vh, 0);
    transform: translate3d(32vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(86vw, -133vh, 0);
    transform: translate3d(86vw, -133vh, 0);
  }
  }
  @keyframes move-frames-74 {
  from {
  -webkit-transform: translate3d(32vw, 110vh, 0);
    transform: translate3d(32vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(86vw, -133vh, 0);
    transform: translate3d(86vw, -133vh, 0);
  }
  }
  .circle-container:nth-child(74) .circle {
  -webkit-animation-delay: 2220ms;
  animation-delay: 2220ms;
  }
  .circle-container:nth-child(75) {
  width: 8px;
  height: 8px;
  -webkit-animation-name: move-frames-75;
  animation-name: move-frames-75;
  -webkit-animation-duration: 10472ms;
  animation-duration: 10472ms;
  -webkit-animation-delay: 7501ms;
  animation-delay: 7501ms;
  }
  @-webkit-keyframes move-frames-75 {
  from {
  -webkit-transform: translate3d(1vw, 108vh, 0);
    transform: translate3d(1vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(43vw, -134vh, 0);
    transform: translate3d(43vw, -134vh, 0);
  }
  }
  @keyframes move-frames-75 {
  from {
  -webkit-transform: translate3d(1vw, 108vh, 0);
    transform: translate3d(1vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(43vw, -134vh, 0);
    transform: translate3d(43vw, -134vh, 0);
  }
  }
  .circle-container:nth-child(75) .circle {
  -webkit-animation-delay: 516ms;
  animation-delay: 516ms;
  }
  .circle-container:nth-child(76) {
  width: 7px;
  height: 7px;
  -webkit-animation-name: move-frames-76;
  animation-name: move-frames-76;
  -webkit-animation-duration: 10365ms;
  animation-duration: 10365ms;
  -webkit-animation-delay: 10039ms;
  animation-delay: 10039ms;
  }
  @-webkit-keyframes move-frames-76 {
  from {
  -webkit-transform: translate3d(90vw, 108vh, 0);
    transform: translate3d(90vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(10vw, -110vh, 0);
    transform: translate3d(10vw, -110vh, 0);
  }
  }
  @keyframes move-frames-76 {
  from {
  -webkit-transform: translate3d(90vw, 108vh, 0);
    transform: translate3d(90vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(10vw, -110vh, 0);
    transform: translate3d(10vw, -110vh, 0);
  }
  }
  .circle-container:nth-child(76) .circle {
  -webkit-animation-delay: 2136ms;
  animation-delay: 2136ms;
  }
  .circle-container:nth-child(77) {
  width: 8px;
  height: 8px;
  -webkit-animation-name: move-frames-77;
  animation-name: move-frames-77;
  -webkit-animation-duration: 7324ms;
  animation-duration: 7324ms;
  -webkit-animation-delay: 5206ms;
  animation-delay: 5206ms;
  }
  @-webkit-keyframes move-frames-77 {
  from {
  -webkit-transform: translate3d(77vw, 108vh, 0);
    transform: translate3d(77vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(49vw, -133vh, 0);
    transform: translate3d(49vw, -133vh, 0);
  }
  }
  @keyframes move-frames-77 {
  from {
  -webkit-transform: translate3d(77vw, 108vh, 0);
    transform: translate3d(77vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(49vw, -133vh, 0);
    transform: translate3d(49vw, -133vh, 0);
  }
  }
  .circle-container:nth-child(77) .circle {
  -webkit-animation-delay: 2074ms;
  animation-delay: 2074ms;
  }
  .circle-container:nth-child(78) {
  width: 8px;
  height: 8px;
  -webkit-animation-name: move-frames-78;
  animation-name: move-frames-78;
  -webkit-animation-duration: 9891ms;
  animation-duration: 9891ms;
  -webkit-animation-delay: 2591ms;
  animation-delay: 2591ms;
  }
  @-webkit-keyframes move-frames-78 {
  from {
  -webkit-transform: translate3d(18vw, 108vh, 0);
    transform: translate3d(18vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(64vw, -128vh, 0);
    transform: translate3d(64vw, -128vh, 0);
  }
  }
  @keyframes move-frames-78 {
  from {
  -webkit-transform: translate3d(18vw, 108vh, 0);
    transform: translate3d(18vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(64vw, -128vh, 0);
    transform: translate3d(64vw, -128vh, 0);
  }
  }
  .circle-container:nth-child(78) .circle {
  -webkit-animation-delay: 1553ms;
  animation-delay: 1553ms;
  }
  .circle-container:nth-child(79) {
  width: 8px;
  height: 8px;
  -webkit-animation-name: move-frames-79;
  animation-name: move-frames-79;
  -webkit-animation-duration: 8874ms;
  animation-duration: 8874ms;
  -webkit-animation-delay: 248ms;
  animation-delay: 248ms;
  }
  @-webkit-keyframes move-frames-79 {
  from {
  -webkit-transform: translate3d(54vw, 106vh, 0);
    transform: translate3d(54vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(60vw, -129vh, 0);
    transform: translate3d(60vw, -129vh, 0);
  }
  }
  @keyframes move-frames-79 {
  from {
  -webkit-transform: translate3d(54vw, 106vh, 0);
    transform: translate3d(54vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(60vw, -129vh, 0);
    transform: translate3d(60vw, -129vh, 0);
  }
  }
  .circle-container:nth-child(79) .circle {
  -webkit-animation-delay: 3636ms;
  animation-delay: 3636ms;
  }
  .circle-container:nth-child(80) {
  width: 5px;
  height: 5px;
  -webkit-animation-name: move-frames-80;
  animation-name: move-frames-80;
  -webkit-animation-duration: 9729ms;
  animation-duration: 9729ms;
  -webkit-animation-delay: 2633ms;
  animation-delay: 2633ms;
  }
  @-webkit-keyframes move-frames-80 {
  from {
  -webkit-transform: translate3d(43vw, 109vh, 0);
    transform: translate3d(43vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(2vw, -118vh, 0);
    transform: translate3d(2vw, -118vh, 0);
  }
  }
  @keyframes move-frames-80 {
  from {
  -webkit-transform: translate3d(43vw, 109vh, 0);
    transform: translate3d(43vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(2vw, -118vh, 0);
    transform: translate3d(2vw, -118vh, 0);
  }
  }
  .circle-container:nth-child(80) .circle {
  -webkit-animation-delay: 714ms;
  animation-delay: 714ms;
  }
  .circle-container:nth-child(81) {
  width: 5px;
  height: 5px;
  -webkit-animation-name: move-frames-81;
  animation-name: move-frames-81;
  -webkit-animation-duration: 7842ms;
  animation-duration: 7842ms;
  -webkit-animation-delay: 546ms;
  animation-delay: 546ms;
  }
  @-webkit-keyframes move-frames-81 {
  from {
  -webkit-transform: translate3d(10vw, 104vh, 0);
    transform: translate3d(10vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(57vw, -111vh, 0);
    transform: translate3d(57vw, -111vh, 0);
  }
  }
  @keyframes move-frames-81 {
  from {
  -webkit-transform: translate3d(10vw, 104vh, 0);
    transform: translate3d(10vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(57vw, -111vh, 0);
    transform: translate3d(57vw, -111vh, 0);
  }
  }
  .circle-container:nth-child(81) .circle {
  -webkit-animation-delay: 1170ms;
  animation-delay: 1170ms;
  }
  .circle-container:nth-child(82) {
  width: 8px;
  height: 8px;
  -webkit-animation-name: move-frames-82;
  animation-name: move-frames-82;
  -webkit-animation-duration: 9802ms;
  animation-duration: 9802ms;
  -webkit-animation-delay: 1939ms;
  animation-delay: 1939ms;
  }
  @-webkit-keyframes move-frames-82 {
  from {
  -webkit-transform: translate3d(34vw, 110vh, 0);
    transform: translate3d(34vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(72vw, -140vh, 0);
    transform: translate3d(72vw, -140vh, 0);
  }
  }
  @keyframes move-frames-82 {
  from {
  -webkit-transform: translate3d(34vw, 110vh, 0);
    transform: translate3d(34vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(72vw, -140vh, 0);
    transform: translate3d(72vw, -140vh, 0);
  }
  }
  .circle-container:nth-child(82) .circle {
  -webkit-animation-delay: 1031ms;
  animation-delay: 1031ms;
  }
  .circle-container:nth-child(83) {
  width: 7px;
  height: 7px;
  -webkit-animation-name: move-frames-83;
  animation-name: move-frames-83;
  -webkit-animation-duration: 7859ms;
  animation-duration: 7859ms;
  -webkit-animation-delay: 446ms;
  animation-delay: 446ms;
  }
  @-webkit-keyframes move-frames-83 {
  from {
  -webkit-transform: translate3d(100vw, 107vh, 0);
    transform: translate3d(100vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(29vw, -110vh, 0);
    transform: translate3d(29vw, -110vh, 0);
  }
  }
  @keyframes move-frames-83 {
  from {
  -webkit-transform: translate3d(100vw, 107vh, 0);
    transform: translate3d(100vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(29vw, -110vh, 0);
    transform: translate3d(29vw, -110vh, 0);
  }
  }
  .circle-container:nth-child(83) .circle {
  -webkit-animation-delay: 1491ms;
  animation-delay: 1491ms;
  }
  .circle-container:nth-child(84) {
  width: 5px;
  height: 5px;
  -webkit-animation-name: move-frames-84;
  animation-name: move-frames-84;
  -webkit-animation-duration: 10792ms;
  animation-duration: 10792ms;
  -webkit-animation-delay: 6434ms;
  animation-delay: 6434ms;
  }
  @-webkit-keyframes move-frames-84 {
  from {
  -webkit-transform: translate3d(39vw, 107vh, 0);
    transform: translate3d(39vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(31vw, -124vh, 0);
    transform: translate3d(31vw, -124vh, 0);
  }
  }
  @keyframes move-frames-84 {
  from {
  -webkit-transform: translate3d(39vw, 107vh, 0);
    transform: translate3d(39vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(31vw, -124vh, 0);
    transform: translate3d(31vw, -124vh, 0);
  }
  }
  .circle-container:nth-child(84) .circle {
  -webkit-animation-delay: 2321ms;
  animation-delay: 2321ms;
  }
  .circle-container:nth-child(85) {
  width: 7px;
  height: 7px;
  -webkit-animation-name: move-frames-85;
  animation-name: move-frames-85;
  -webkit-animation-duration: 9683ms;
  animation-duration: 9683ms;
  -webkit-animation-delay: 6951ms;
  animation-delay: 6951ms;
  }
  @-webkit-keyframes move-frames-85 {
  from {
  -webkit-transform: translate3d(15vw, 104vh, 0);
    transform: translate3d(15vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(34vw, -129vh, 0);
    transform: translate3d(34vw, -129vh, 0);
  }
  }
  @keyframes move-frames-85 {
  from {
  -webkit-transform: translate3d(15vw, 104vh, 0);
    transform: translate3d(15vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(34vw, -129vh, 0);
    transform: translate3d(34vw, -129vh, 0);
  }
  }
  .circle-container:nth-child(85) .circle {
  -webkit-animation-delay: 983ms;
  animation-delay: 983ms;
  }
  .circle-container:nth-child(86) {
  width: 8px;
  height: 8px;
  -webkit-animation-name: move-frames-86;
  animation-name: move-frames-86;
  -webkit-animation-duration: 10918ms;
  animation-duration: 10918ms;
  -webkit-animation-delay: 4101ms;
  animation-delay: 4101ms;
  }
  @-webkit-keyframes move-frames-86 {
  from {
  -webkit-transform: translate3d(89vw, 102vh, 0);
    transform: translate3d(89vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(42vw, -104vh, 0);
    transform: translate3d(42vw, -104vh, 0);
  }
  }
  @keyframes move-frames-86 {
  from {
  -webkit-transform: translate3d(89vw, 102vh, 0);
    transform: translate3d(89vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(42vw, -104vh, 0);
    transform: translate3d(42vw, -104vh, 0);
  }
  }
  .circle-container:nth-child(86) .circle {
  -webkit-animation-delay: 3608ms;
  animation-delay: 3608ms;
  }
  .circle-container:nth-child(87) {
  width: 8px;
  height: 8px;
  -webkit-animation-name: move-frames-87;
  animation-name: move-frames-87;
  -webkit-animation-duration: 8780ms;
  animation-duration: 8780ms;
  -webkit-animation-delay: 10426ms;
  animation-delay: 10426ms;
  }
  @-webkit-keyframes move-frames-87 {
  from {
  -webkit-transform: translate3d(69vw, 110vh, 0);
    transform: translate3d(69vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(71vw, -140vh, 0);
    transform: translate3d(71vw, -140vh, 0);
  }
  }
  @keyframes move-frames-87 {
  from {
  -webkit-transform: translate3d(69vw, 110vh, 0);
    transform: translate3d(69vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(71vw, -140vh, 0);
    transform: translate3d(71vw, -140vh, 0);
  }
  }
  .circle-container:nth-child(87) .circle {
  -webkit-animation-delay: 2568ms;
  animation-delay: 2568ms;
  }
  .circle-container:nth-child(88) {
  width: 3px;
  height: 3px;
  -webkit-animation-name: move-frames-88;
  animation-name: move-frames-88;
  -webkit-animation-duration: 10452ms;
  animation-duration: 10452ms;
  -webkit-animation-delay: 9403ms;
  animation-delay: 9403ms;
  }
  @-webkit-keyframes move-frames-88 {
  from {
  -webkit-transform: translate3d(7vw, 107vh, 0);
    transform: translate3d(7vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(56vw, -119vh, 0);
    transform: translate3d(56vw, -119vh, 0);
  }
  }
  @keyframes move-frames-88 {
  from {
  -webkit-transform: translate3d(7vw, 107vh, 0);
    transform: translate3d(7vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(56vw, -119vh, 0);
    transform: translate3d(56vw, -119vh, 0);
  }
  }
  .circle-container:nth-child(88) .circle {
  -webkit-animation-delay: 1258ms;
  animation-delay: 1258ms;
  }
  .circle-container:nth-child(89) {
  width: 1px;
  height: 1px;
  -webkit-animation-name: move-frames-89;
  animation-name: move-frames-89;
  -webkit-animation-duration: 7294ms;
  animation-duration: 7294ms;
  -webkit-animation-delay: 3320ms;
  animation-delay: 3320ms;
  }
  @-webkit-keyframes move-frames-89 {
  from {
  -webkit-transform: translate3d(4vw, 107vh, 0);
    transform: translate3d(4vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(82vw, -121vh, 0);
    transform: translate3d(82vw, -121vh, 0);
  }
  }
  @keyframes move-frames-89 {
  from {
  -webkit-transform: translate3d(4vw, 107vh, 0);
    transform: translate3d(4vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(82vw, -121vh, 0);
    transform: translate3d(82vw, -121vh, 0);
  }
  }
  .circle-container:nth-child(89) .circle {
  -webkit-animation-delay: 2167ms;
  animation-delay: 2167ms;
  }
  .circle-container:nth-child(90) {
  width: 9px;
  height: 9px;
  -webkit-animation-name: move-frames-90;
  animation-name: move-frames-90;
  -webkit-animation-duration: 7597ms;
  animation-duration: 7597ms;
  -webkit-animation-delay: 6477ms;
  animation-delay: 6477ms;
  }
  @-webkit-keyframes move-frames-90 {
  from {
  -webkit-transform: translate3d(56vw, 106vh, 0);
    transform: translate3d(56vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(36vw, -114vh, 0);
    transform: translate3d(36vw, -114vh, 0);
  }
  }
  @keyframes move-frames-90 {
  from {
  -webkit-transform: translate3d(56vw, 106vh, 0);
    transform: translate3d(56vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(36vw, -114vh, 0);
    transform: translate3d(36vw, -114vh, 0);
  }
  }
  .circle-container:nth-child(90) .circle {
  -webkit-animation-delay: 1757ms;
  animation-delay: 1757ms;
  }
  .circle-container:nth-child(91) {
  width: 4px;
  height: 4px;
  -webkit-animation-name: move-frames-91;
  animation-name: move-frames-91;
  -webkit-animation-duration: 7882ms;
  animation-duration: 7882ms;
  -webkit-animation-delay: 1017ms;
  animation-delay: 1017ms;
  }
  @-webkit-keyframes move-frames-91 {
  from {
  -webkit-transform: translate3d(11vw, 109vh, 0);
    transform: translate3d(11vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(62vw, -136vh, 0);
    transform: translate3d(62vw, -136vh, 0);
  }
  }
  @keyframes move-frames-91 {
  from {
  -webkit-transform: translate3d(11vw, 109vh, 0);
    transform: translate3d(11vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(62vw, -136vh, 0);
    transform: translate3d(62vw, -136vh, 0);
  }
  }
  .circle-container:nth-child(91) .circle {
  -webkit-animation-delay: 1223ms;
  animation-delay: 1223ms;
  }
  .circle-container:nth-child(92) {
  width: 4px;
  height: 4px;
  -webkit-animation-name: move-frames-92;
  animation-name: move-frames-92;
  -webkit-animation-duration: 7522ms;
  animation-duration: 7522ms;
  -webkit-animation-delay: 4140ms;
  animation-delay: 4140ms;
  }
  @-webkit-keyframes move-frames-92 {
  from {
  -webkit-transform: translate3d(42vw, 105vh, 0);
    transform: translate3d(42vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(88vw, -112vh, 0);
    transform: translate3d(88vw, -112vh, 0);
  }
  }
  @keyframes move-frames-92 {
  from {
  -webkit-transform: translate3d(42vw, 105vh, 0);
    transform: translate3d(42vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(88vw, -112vh, 0);
    transform: translate3d(88vw, -112vh, 0);
  }
  }
  .circle-container:nth-child(92) .circle {
  -webkit-animation-delay: 3443ms;
  animation-delay: 3443ms;
  }
  .circle-container:nth-child(93) {
  width: 10px;
  height: 10px;
  -webkit-animation-name: move-frames-93;
  animation-name: move-frames-93;
  -webkit-animation-duration: 8902ms;
  animation-duration: 8902ms;
  -webkit-animation-delay: 10303ms;
  animation-delay: 10303ms;
  }
  @-webkit-keyframes move-frames-93 {
  from {
  -webkit-transform: translate3d(39vw, 101vh, 0);
    transform: translate3d(39vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(19vw, -103vh, 0);
    transform: translate3d(19vw, -103vh, 0);
  }
  }
  @keyframes move-frames-93 {
  from {
  -webkit-transform: translate3d(39vw, 101vh, 0);
    transform: translate3d(39vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(19vw, -103vh, 0);
    transform: translate3d(19vw, -103vh, 0);
  }
  }
  .circle-container:nth-child(93) .circle {
  -webkit-animation-delay: 2379ms;
  animation-delay: 2379ms;
  }
  .circle-container:nth-child(94) {
  width: 6px;
  height: 6px;
  -webkit-animation-name: move-frames-94;
  animation-name: move-frames-94;
  -webkit-animation-duration: 9244ms;
  animation-duration: 9244ms;
  -webkit-animation-delay: 9422ms;
  animation-delay: 9422ms;
  }
  @-webkit-keyframes move-frames-94 {
  from {
  -webkit-transform: translate3d(56vw, 109vh, 0);
    transform: translate3d(56vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(97vw, -122vh, 0);
    transform: translate3d(97vw, -122vh, 0);
  }
  }
  @keyframes move-frames-94 {
  from {
  -webkit-transform: translate3d(56vw, 109vh, 0);
    transform: translate3d(56vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(97vw, -122vh, 0);
    transform: translate3d(97vw, -122vh, 0);
  }
  }
  .circle-container:nth-child(94) .circle {
  -webkit-animation-delay: 2003ms;
  animation-delay: 2003ms;
  }
  .circle-container:nth-child(95) {
  width: 10px;
  height: 10px;
  -webkit-animation-name: move-frames-95;
  animation-name: move-frames-95;
  -webkit-animation-duration: 9826ms;
  animation-duration: 9826ms;
  -webkit-animation-delay: 10570ms;
  animation-delay: 10570ms;
  }
  @-webkit-keyframes move-frames-95 {
  from {
  -webkit-transform: translate3d(7vw, 101vh, 0);
    transform: translate3d(7vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(46vw, -103vh, 0);
    transform: translate3d(46vw, -103vh, 0);
  }
  }
  @keyframes move-frames-95 {
  from {
  -webkit-transform: translate3d(7vw, 101vh, 0);
    transform: translate3d(7vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(46vw, -103vh, 0);
    transform: translate3d(46vw, -103vh, 0);
  }
  }
  .circle-container:nth-child(95) .circle {
  -webkit-animation-delay: 362ms;
  animation-delay: 362ms;
  }
  .circle-container:nth-child(96) {
  width: 4px;
  height: 4px;
  -webkit-animation-name: move-frames-96;
  animation-name: move-frames-96;
  -webkit-animation-duration: 10054ms;
  animation-duration: 10054ms;
  -webkit-animation-delay: 1056ms;
  animation-delay: 1056ms;
  }
  @-webkit-keyframes move-frames-96 {
  from {
  -webkit-transform: translate3d(76vw, 107vh, 0);
    transform: translate3d(76vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(39vw, -121vh, 0);
    transform: translate3d(39vw, -121vh, 0);
  }
  }
  @keyframes move-frames-96 {
  from {
  -webkit-transform: translate3d(76vw, 107vh, 0);
    transform: translate3d(76vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(39vw, -121vh, 0);
    transform: translate3d(39vw, -121vh, 0);
  }
  }
  .circle-container:nth-child(96) .circle {
  -webkit-animation-delay: 2821ms;
  animation-delay: 2821ms;
  }
  .circle-container:nth-child(97) {
  width: 10px;
  height: 10px;
  -webkit-animation-name: move-frames-97;
  animation-name: move-frames-97;
  -webkit-animation-duration: 9045ms;
  animation-duration: 9045ms;
  -webkit-animation-delay: 7780ms;
  animation-delay: 7780ms;
  }
  @-webkit-keyframes move-frames-97 {
  from {
  -webkit-transform: translate3d(6vw, 109vh, 0);
    transform: translate3d(6vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(54vw, -132vh, 0);
    transform: translate3d(54vw, -132vh, 0);
  }
  }
  @keyframes move-frames-97 {
  from {
  -webkit-transform: translate3d(6vw, 109vh, 0);
    transform: translate3d(6vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(54vw, -132vh, 0);
    transform: translate3d(54vw, -132vh, 0);
  }
  }
  .circle-container:nth-child(97) .circle {
  -webkit-animation-delay: 105ms;
  animation-delay: 105ms;
  }
  .circle-container:nth-child(98) {
  width: 6px;
  height: 6px;
  -webkit-animation-name: move-frames-98;
  animation-name: move-frames-98;
  -webkit-animation-duration: 9139ms;
  animation-duration: 9139ms;
  -webkit-animation-delay: 5911ms;
  animation-delay: 5911ms;
  }
  @-webkit-keyframes move-frames-98 {
  from {
  -webkit-transform: translate3d(6vw, 108vh, 0);
    transform: translate3d(6vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(99vw, -113vh, 0);
    transform: translate3d(99vw, -113vh, 0);
  }
  }
  @keyframes move-frames-98 {
  from {
  -webkit-transform: translate3d(6vw, 108vh, 0);
    transform: translate3d(6vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(99vw, -113vh, 0);
    transform: translate3d(99vw, -113vh, 0);
  }
  }
  .circle-container:nth-child(98) .circle {
  -webkit-animation-delay: 3731ms;
  animation-delay: 3731ms;
  }
  .circle-container:nth-child(99) {
  width: 2px;
  height: 2px;
  -webkit-animation-name: move-frames-99;
  animation-name: move-frames-99;
  -webkit-animation-duration: 7596ms;
  animation-duration: 7596ms;
  -webkit-animation-delay: 8503ms;
  animation-delay: 8503ms;
  }
  @-webkit-keyframes move-frames-99 {
  from {
  -webkit-transform: translate3d(73vw, 110vh, 0);
    transform: translate3d(73vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(83vw, -119vh, 0);
    transform: translate3d(83vw, -119vh, 0);
  }
  }
  @keyframes move-frames-99 {
  from {
  -webkit-transform: translate3d(73vw, 110vh, 0);
    transform: translate3d(73vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(83vw, -119vh, 0);
    transform: translate3d(83vw, -119vh, 0);
  }
  }
  .circle-container:nth-child(99) .circle {
  -webkit-animation-delay: 2521ms;
  animation-delay: 2521ms;
  }
  .circle-container:nth-child(100) {
  width: 1px;
  height: 1px;
  -webkit-animation-name: move-frames-100;
  animation-name: move-frames-100;
  -webkit-animation-duration: 10293ms;
  animation-duration: 10293ms;
  -webkit-animation-delay: 8481ms;
  animation-delay: 8481ms;
  }
  @-webkit-keyframes move-frames-100 {
  from {
  -webkit-transform: translate3d(74vw, 103vh, 0);
    transform: translate3d(74vw, 103vh, 0);
  }
  to {
  -webkit-transform: translate3d(6vw, -109vh, 0);
    transform: translate3d(6vw, -109vh, 0);
  }
  }
  @keyframes move-frames-100 {
  from {
  -webkit-transform: translate3d(74vw, 103vh, 0);
    transform: translate3d(74vw, 103vh, 0);
  }
  to {
  -webkit-transform: translate3d(6vw, -109vh, 0);
    transform: translate3d(6vw, -109vh, 0);
  }
  }
  .circle-container:nth-child(100) .circle {
  -webkit-animation-delay: 962ms;
  animation-delay: 962ms;
  }
  .circle-container:nth-child(101) {
  width: 4px;
  height: 4px;
  -webkit-animation-name: move-frames-101;
  animation-name: move-frames-101;
  -webkit-animation-duration: 7016ms;
  animation-duration: 7016ms;
  -webkit-animation-delay: 1697ms;
  animation-delay: 1697ms;
  }
  @-webkit-keyframes move-frames-101 {
  from {
  -webkit-transform: translate3d(42vw, 105vh, 0);
    transform: translate3d(42vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(79vw, -132vh, 0);
    transform: translate3d(79vw, -132vh, 0);
  }
  }
  @keyframes move-frames-101 {
  from {
  -webkit-transform: translate3d(42vw, 105vh, 0);
    transform: translate3d(42vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(79vw, -132vh, 0);
    transform: translate3d(79vw, -132vh, 0);
  }
  }
  .circle-container:nth-child(101) .circle {
  -webkit-animation-delay: 922ms;
  animation-delay: 922ms;
  }
  .circle-container:nth-child(102) {
  width: 1px;
  height: 1px;
  -webkit-animation-name: move-frames-102;
  animation-name: move-frames-102;
  -webkit-animation-duration: 10652ms;
  animation-duration: 10652ms;
  -webkit-animation-delay: 9063ms;
  animation-delay: 9063ms;
  }
  @-webkit-keyframes move-frames-102 {
  from {
  -webkit-transform: translate3d(26vw, 102vh, 0);
    transform: translate3d(26vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(79vw, -112vh, 0);
    transform: translate3d(79vw, -112vh, 0);
  }
  }
  @keyframes move-frames-102 {
  from {
  -webkit-transform: translate3d(26vw, 102vh, 0);
    transform: translate3d(26vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(79vw, -112vh, 0);
    transform: translate3d(79vw, -112vh, 0);
  }
  }
  .circle-container:nth-child(102) .circle {
  -webkit-animation-delay: 3345ms;
  animation-delay: 3345ms;
  }
  .circle-container:nth-child(103) {
  width: 8px;
  height: 8px;
  -webkit-animation-name: move-frames-103;
  animation-name: move-frames-103;
  -webkit-animation-duration: 7234ms;
  animation-duration: 7234ms;
  -webkit-animation-delay: 6845ms;
  animation-delay: 6845ms;
  }
  @-webkit-keyframes move-frames-103 {
  from {
  -webkit-transform: translate3d(57vw, 106vh, 0);
    transform: translate3d(57vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(65vw, -122vh, 0);
    transform: translate3d(65vw, -122vh, 0);
  }
  }
  @keyframes move-frames-103 {
  from {
  -webkit-transform: translate3d(57vw, 106vh, 0);
    transform: translate3d(57vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(65vw, -122vh, 0);
    transform: translate3d(65vw, -122vh, 0);
  }
  }
  .circle-container:nth-child(103) .circle {
  -webkit-animation-delay: 258ms;
  animation-delay: 258ms;
  }
  .circle-container:nth-child(104) {
  width: 3px;
  height: 3px;
  -webkit-animation-name: move-frames-104;
  animation-name: move-frames-104;
  -webkit-animation-duration: 7793ms;
  animation-duration: 7793ms;
  -webkit-animation-delay: 6048ms;
  animation-delay: 6048ms;
  }
  @-webkit-keyframes move-frames-104 {
  from {
  -webkit-transform: translate3d(96vw, 102vh, 0);
    transform: translate3d(96vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(82vw, -111vh, 0);
    transform: translate3d(82vw, -111vh, 0);
  }
  }
  @keyframes move-frames-104 {
  from {
  -webkit-transform: translate3d(96vw, 102vh, 0);
    transform: translate3d(96vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(82vw, -111vh, 0);
    transform: translate3d(82vw, -111vh, 0);
  }
  }
  .circle-container:nth-child(104) .circle {
  -webkit-animation-delay: 3582ms;
  animation-delay: 3582ms;
  }
  .circle-container:nth-child(105) {
  width: 3px;
  height: 3px;
  -webkit-animation-name: move-frames-105;
  animation-name: move-frames-105;
  -webkit-animation-duration: 9140ms;
  animation-duration: 9140ms;
  -webkit-animation-delay: 8626ms;
  animation-delay: 8626ms;
  }
  @-webkit-keyframes move-frames-105 {
  from {
  -webkit-transform: translate3d(77vw, 108vh, 0);
    transform: translate3d(77vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(83vw, -134vh, 0);
    transform: translate3d(83vw, -134vh, 0);
  }
  }
  @keyframes move-frames-105 {
  from {
  -webkit-transform: translate3d(77vw, 108vh, 0);
    transform: translate3d(77vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(83vw, -134vh, 0);
    transform: translate3d(83vw, -134vh, 0);
  }
  }
  .circle-container:nth-child(105) .circle {
  -webkit-animation-delay: 2630ms;
  animation-delay: 2630ms;
  }
  .circle-container:nth-child(106) {
  width: 1px;
  height: 1px;
  -webkit-animation-name: move-frames-106;
  animation-name: move-frames-106;
  -webkit-animation-duration: 7381ms;
  animation-duration: 7381ms;
  -webkit-animation-delay: 5221ms;
  animation-delay: 5221ms;
  }
  @-webkit-keyframes move-frames-106 {
  from {
  -webkit-transform: translate3d(74vw, 106vh, 0);
    transform: translate3d(74vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(26vw, -128vh, 0);
    transform: translate3d(26vw, -128vh, 0);
  }
  }
  @keyframes move-frames-106 {
  from {
  -webkit-transform: translate3d(74vw, 106vh, 0);
    transform: translate3d(74vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(26vw, -128vh, 0);
    transform: translate3d(26vw, -128vh, 0);
  }
  }
  .circle-container:nth-child(106) .circle {
  -webkit-animation-delay: 2376ms;
  animation-delay: 2376ms;
  }
  .circle-container:nth-child(107) {
  width: 2px;
  height: 2px;
  -webkit-animation-name: move-frames-107;
  animation-name: move-frames-107;
  -webkit-animation-duration: 7716ms;
  animation-duration: 7716ms;
  -webkit-animation-delay: 3094ms;
  animation-delay: 3094ms;
  }
  @-webkit-keyframes move-frames-107 {
  from {
  -webkit-transform: translate3d(87vw, 105vh, 0);
    transform: translate3d(87vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(65vw, -129vh, 0);
    transform: translate3d(65vw, -129vh, 0);
  }
  }
  @keyframes move-frames-107 {
  from {
  -webkit-transform: translate3d(87vw, 105vh, 0);
    transform: translate3d(87vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(65vw, -129vh, 0);
    transform: translate3d(65vw, -129vh, 0);
  }
  }
  .circle-container:nth-child(107) .circle {
  -webkit-animation-delay: 3718ms;
  animation-delay: 3718ms;
  }
  .circle-container:nth-child(108) {
  width: 7px;
  height: 7px;
  -webkit-animation-name: move-frames-108;
  animation-name: move-frames-108;
  -webkit-animation-duration: 7870ms;
  animation-duration: 7870ms;
  -webkit-animation-delay: 4563ms;
  animation-delay: 4563ms;
  }
  @-webkit-keyframes move-frames-108 {
  from {
  -webkit-transform: translate3d(4vw, 103vh, 0);
    transform: translate3d(4vw, 103vh, 0);
  }
  to {
  -webkit-transform: translate3d(45vw, -130vh, 0);
    transform: translate3d(45vw, -130vh, 0);
  }
  }
  @keyframes move-frames-108 {
  from {
  -webkit-transform: translate3d(4vw, 103vh, 0);
    transform: translate3d(4vw, 103vh, 0);
  }
  to {
  -webkit-transform: translate3d(45vw, -130vh, 0);
    transform: translate3d(45vw, -130vh, 0);
  }
  }
  .circle-container:nth-child(108) .circle {
  -webkit-animation-delay: 2035ms;
  animation-delay: 2035ms;
  }
  .circle-container:nth-child(109) {
  width: 9px;
  height: 9px;
  -webkit-animation-name: move-frames-109;
  animation-name: move-frames-109;
  -webkit-animation-duration: 7879ms;
  animation-duration: 7879ms;
  -webkit-animation-delay: 10644ms;
  animation-delay: 10644ms;
  }
  @-webkit-keyframes move-frames-109 {
  from {
  -webkit-transform: translate3d(68vw, 107vh, 0);
    transform: translate3d(68vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(97vw, -131vh, 0);
    transform: translate3d(97vw, -131vh, 0);
  }
  }
  @keyframes move-frames-109 {
  from {
  -webkit-transform: translate3d(68vw, 107vh, 0);
    transform: translate3d(68vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(97vw, -131vh, 0);
    transform: translate3d(97vw, -131vh, 0);
  }
  }
  .circle-container:nth-child(109) .circle {
  -webkit-animation-delay: 2454ms;
  animation-delay: 2454ms;
  }
  .circle-container:nth-child(110) {
  width: 6px;
  height: 6px;
  -webkit-animation-name: move-frames-110;
  animation-name: move-frames-110;
  -webkit-animation-duration: 8829ms;
  animation-duration: 8829ms;
  -webkit-animation-delay: 9834ms;
  animation-delay: 9834ms;
  }
  @-webkit-keyframes move-frames-110 {
  from {
  -webkit-transform: translate3d(82vw, 110vh, 0);
    transform: translate3d(82vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(60vw, -118vh, 0);
    transform: translate3d(60vw, -118vh, 0);
  }
  }
  @keyframes move-frames-110 {
  from {
  -webkit-transform: translate3d(82vw, 110vh, 0);
    transform: translate3d(82vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(60vw, -118vh, 0);
    transform: translate3d(60vw, -118vh, 0);
  }
  }
  .circle-container:nth-child(110) .circle {
  -webkit-animation-delay: 2585ms;
  animation-delay: 2585ms;
  }
  .circle-container:nth-child(111) {
  width: 1px;
  height: 1px;
  -webkit-animation-name: move-frames-111;
  animation-name: move-frames-111;
  -webkit-animation-duration: 10875ms;
  animation-duration: 10875ms;
  -webkit-animation-delay: 6403ms;
  animation-delay: 6403ms;
  }
  @-webkit-keyframes move-frames-111 {
  from {
  -webkit-transform: translate3d(45vw, 108vh, 0);
    transform: translate3d(45vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(76vw, -133vh, 0);
    transform: translate3d(76vw, -133vh, 0);
  }
  }
  @keyframes move-frames-111 {
  from {
  -webkit-transform: translate3d(45vw, 108vh, 0);
    transform: translate3d(45vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(76vw, -133vh, 0);
    transform: translate3d(76vw, -133vh, 0);
  }
  }
  .circle-container:nth-child(111) .circle {
  -webkit-animation-delay: 1117ms;
  animation-delay: 1117ms;
  }
  .circle-container:nth-child(112) {
  width: 2px;
  height: 2px;
  -webkit-animation-name: move-frames-112;
  animation-name: move-frames-112;
  -webkit-animation-duration: 9977ms;
  animation-duration: 9977ms;
  -webkit-animation-delay: 3062ms;
  animation-delay: 3062ms;
  }
  @-webkit-keyframes move-frames-112 {
  from {
  -webkit-transform: translate3d(84vw, 108vh, 0);
    transform: translate3d(84vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(100vw, -111vh, 0);
    transform: translate3d(100vw, -111vh, 0);
  }
  }
  @keyframes move-frames-112 {
  from {
  -webkit-transform: translate3d(84vw, 108vh, 0);
    transform: translate3d(84vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(100vw, -111vh, 0);
    transform: translate3d(100vw, -111vh, 0);
  }
  }
  .circle-container:nth-child(112) .circle {
  -webkit-animation-delay: 366ms;
  animation-delay: 366ms;
  }
  .circle-container:nth-child(113) {
  width: 6px;
  height: 6px;
  -webkit-animation-name: move-frames-113;
  animation-name: move-frames-113;
  -webkit-animation-duration: 9739ms;
  animation-duration: 9739ms;
  -webkit-animation-delay: 6453ms;
  animation-delay: 6453ms;
  }
  @-webkit-keyframes move-frames-113 {
  from {
  -webkit-transform: translate3d(92vw, 108vh, 0);
    transform: translate3d(92vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(86vw, -127vh, 0);
    transform: translate3d(86vw, -127vh, 0);
  }
  }
  @keyframes move-frames-113 {
  from {
  -webkit-transform: translate3d(92vw, 108vh, 0);
    transform: translate3d(92vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(86vw, -127vh, 0);
    transform: translate3d(86vw, -127vh, 0);
  }
  }
  .circle-container:nth-child(113) .circle {
  -webkit-animation-delay: 1186ms;
  animation-delay: 1186ms;
  }
  .circle-container:nth-child(114) {
  width: 7px;
  height: 7px;
  -webkit-animation-name: move-frames-114;
  animation-name: move-frames-114;
  -webkit-animation-duration: 10857ms;
  animation-duration: 10857ms;
  -webkit-animation-delay: 10467ms;
  animation-delay: 10467ms;
  }
  @-webkit-keyframes move-frames-114 {
  from {
  -webkit-transform: translate3d(82vw, 104vh, 0);
    transform: translate3d(82vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(65vw, -108vh, 0);
    transform: translate3d(65vw, -108vh, 0);
  }
  }
  @keyframes move-frames-114 {
  from {
  -webkit-transform: translate3d(82vw, 104vh, 0);
    transform: translate3d(82vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(65vw, -108vh, 0);
    transform: translate3d(65vw, -108vh, 0);
  }
  }
  .circle-container:nth-child(114) .circle {
  -webkit-animation-delay: 518ms;
  animation-delay: 518ms;
  }
  .circle-container:nth-child(115) {
  width: 4px;
  height: 4px;
  -webkit-animation-name: move-frames-115;
  animation-name: move-frames-115;
  -webkit-animation-duration: 9241ms;
  animation-duration: 9241ms;
  -webkit-animation-delay: 9990ms;
  animation-delay: 9990ms;
  }
  @-webkit-keyframes move-frames-115 {
  from {
  -webkit-transform: translate3d(33vw, 102vh, 0);
    transform: translate3d(33vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(54vw, -108vh, 0);
    transform: translate3d(54vw, -108vh, 0);
  }
  }
  @keyframes move-frames-115 {
  from {
  -webkit-transform: translate3d(33vw, 102vh, 0);
    transform: translate3d(33vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(54vw, -108vh, 0);
    transform: translate3d(54vw, -108vh, 0);
  }
  }
  .circle-container:nth-child(115) .circle {
  -webkit-animation-delay: 2148ms;
  animation-delay: 2148ms;
  }
  .circle-container:nth-child(116) {
  width: 9px;
  height: 9px;
  -webkit-animation-name: move-frames-116;
  animation-name: move-frames-116;
  -webkit-animation-duration: 10454ms;
  animation-duration: 10454ms;
  -webkit-animation-delay: 8526ms;
  animation-delay: 8526ms;
  }
  @-webkit-keyframes move-frames-116 {
  from {
  -webkit-transform: translate3d(34vw, 109vh, 0);
    transform: translate3d(34vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(7vw, -133vh, 0);
    transform: translate3d(7vw, -133vh, 0);
  }
  }
  @keyframes move-frames-116 {
  from {
  -webkit-transform: translate3d(34vw, 109vh, 0);
    transform: translate3d(34vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(7vw, -133vh, 0);
    transform: translate3d(7vw, -133vh, 0);
  }
  }
  .circle-container:nth-child(116) .circle {
  -webkit-animation-delay: 154ms;
  animation-delay: 154ms;
  }
  .circle-container:nth-child(117) {
  width: 5px;
  height: 5px;
  -webkit-animation-name: move-frames-117;
  animation-name: move-frames-117;
  -webkit-animation-duration: 9465ms;
  animation-duration: 9465ms;
  -webkit-animation-delay: 4586ms;
  animation-delay: 4586ms;
  }
  @-webkit-keyframes move-frames-117 {
  from {
  -webkit-transform: translate3d(29vw, 107vh, 0);
    transform: translate3d(29vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(67vw, -130vh, 0);
    transform: translate3d(67vw, -130vh, 0);
  }
  }
  @keyframes move-frames-117 {
  from {
  -webkit-transform: translate3d(29vw, 107vh, 0);
    transform: translate3d(29vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(67vw, -130vh, 0);
    transform: translate3d(67vw, -130vh, 0);
  }
  }
  .circle-container:nth-child(117) .circle {
  -webkit-animation-delay: 1871ms;
  animation-delay: 1871ms;
  }
  .circle-container:nth-child(118) {
  width: 8px;
  height: 8px;
  -webkit-animation-name: move-frames-118;
  animation-name: move-frames-118;
  -webkit-animation-duration: 9886ms;
  animation-duration: 9886ms;
  -webkit-animation-delay: 8293ms;
  animation-delay: 8293ms;
  }
  @-webkit-keyframes move-frames-118 {
  from {
  -webkit-transform: translate3d(40vw, 105vh, 0);
    transform: translate3d(40vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(1vw, -113vh, 0);
    transform: translate3d(1vw, -113vh, 0);
  }
  }
  @keyframes move-frames-118 {
  from {
  -webkit-transform: translate3d(40vw, 105vh, 0);
    transform: translate3d(40vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(1vw, -113vh, 0);
    transform: translate3d(1vw, -113vh, 0);
  }
  }
  .circle-container:nth-child(118) .circle {
  -webkit-animation-delay: 219ms;
  animation-delay: 219ms;
  }
  .circle-container:nth-child(119) {
  width: 9px;
  height: 9px;
  -webkit-animation-name: move-frames-119;
  animation-name: move-frames-119;
  -webkit-animation-duration: 10227ms;
  animation-duration: 10227ms;
  -webkit-animation-delay: 3018ms;
  animation-delay: 3018ms;
  }
  @-webkit-keyframes move-frames-119 {
  from {
  -webkit-transform: translate3d(80vw, 107vh, 0);
    transform: translate3d(80vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(50vw, -118vh, 0);
    transform: translate3d(50vw, -118vh, 0);
  }
  }
  @keyframes move-frames-119 {
  from {
  -webkit-transform: translate3d(80vw, 107vh, 0);
    transform: translate3d(80vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(50vw, -118vh, 0);
    transform: translate3d(50vw, -118vh, 0);
  }
  }
  .circle-container:nth-child(119) .circle {
  -webkit-animation-delay: 2611ms;
  animation-delay: 2611ms;
  }
  .circle-container:nth-child(120) {
  width: 7px;
  height: 7px;
  -webkit-animation-name: move-frames-120;
  animation-name: move-frames-120;
  -webkit-animation-duration: 9422ms;
  animation-duration: 9422ms;
  -webkit-animation-delay: 182ms;
  animation-delay: 182ms;
  }
  @-webkit-keyframes move-frames-120 {
  from {
  -webkit-transform: translate3d(37vw, 102vh, 0);
    transform: translate3d(37vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(51vw, -106vh, 0);
    transform: translate3d(51vw, -106vh, 0);
  }
  }
  @keyframes move-frames-120 {
  from {
  -webkit-transform: translate3d(37vw, 102vh, 0);
    transform: translate3d(37vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(51vw, -106vh, 0);
    transform: translate3d(51vw, -106vh, 0);
  }
  }
  .circle-container:nth-child(120) .circle {
  -webkit-animation-delay: 3320ms;
  animation-delay: 3320ms;
  }
  .circle-container:nth-child(121) {
  width: 2px;
  height: 2px;
  -webkit-animation-name: move-frames-121;
  animation-name: move-frames-121;
  -webkit-animation-duration: 10706ms;
  animation-duration: 10706ms;
  -webkit-animation-delay: 10552ms;
  animation-delay: 10552ms;
  }
  @-webkit-keyframes move-frames-121 {
  from {
  -webkit-transform: translate3d(60vw, 107vh, 0);
    transform: translate3d(60vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(48vw, -117vh, 0);
    transform: translate3d(48vw, -117vh, 0);
  }
  }
  @keyframes move-frames-121 {
  from {
  -webkit-transform: translate3d(60vw, 107vh, 0);
    transform: translate3d(60vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(48vw, -117vh, 0);
    transform: translate3d(48vw, -117vh, 0);
  }
  }
  .circle-container:nth-child(121) .circle {
  -webkit-animation-delay: 1511ms;
  animation-delay: 1511ms;
  }
  .circle-container:nth-child(122) {
  width: 4px;
  height: 4px;
  -webkit-animation-name: move-frames-122;
  animation-name: move-frames-122;
  -webkit-animation-duration: 7843ms;
  animation-duration: 7843ms;
  -webkit-animation-delay: 6047ms;
  animation-delay: 6047ms;
  }
  @-webkit-keyframes move-frames-122 {
  from {
  -webkit-transform: translate3d(75vw, 101vh, 0);
    transform: translate3d(75vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(89vw, -108vh, 0);
    transform: translate3d(89vw, -108vh, 0);
  }
  }
  @keyframes move-frames-122 {
  from {
  -webkit-transform: translate3d(75vw, 101vh, 0);
    transform: translate3d(75vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(89vw, -108vh, 0);
    transform: translate3d(89vw, -108vh, 0);
  }
  }
  .circle-container:nth-child(122) .circle {
  -webkit-animation-delay: 3722ms;
  animation-delay: 3722ms;
  }
  .circle-container:nth-child(123) {
  width: 7px;
  height: 7px;
  -webkit-animation-name: move-frames-123;
  animation-name: move-frames-123;
  -webkit-animation-duration: 7725ms;
  animation-duration: 7725ms;
  -webkit-animation-delay: 3323ms;
  animation-delay: 3323ms;
  }
  @-webkit-keyframes move-frames-123 {
  from {
  -webkit-transform: translate3d(15vw, 110vh, 0);
    transform: translate3d(15vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(97vw, -126vh, 0);
    transform: translate3d(97vw, -126vh, 0);
  }
  }
  @keyframes move-frames-123 {
  from {
  -webkit-transform: translate3d(15vw, 110vh, 0);
    transform: translate3d(15vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(97vw, -126vh, 0);
    transform: translate3d(97vw, -126vh, 0);
  }
  }
  .circle-container:nth-child(123) .circle {
  -webkit-animation-delay: 2141ms;
  animation-delay: 2141ms;
  }
  .circle-container:nth-child(124) {
  width: 5px;
  height: 5px;
  -webkit-animation-name: move-frames-124;
  animation-name: move-frames-124;
  -webkit-animation-duration: 10994ms;
  animation-duration: 10994ms;
  -webkit-animation-delay: 4420ms;
  animation-delay: 4420ms;
  }
  @-webkit-keyframes move-frames-124 {
  from {
  -webkit-transform: translate3d(97vw, 102vh, 0);
    transform: translate3d(97vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(55vw, -107vh, 0);
    transform: translate3d(55vw, -107vh, 0);
  }
  }
  @keyframes move-frames-124 {
  from {
  -webkit-transform: translate3d(97vw, 102vh, 0);
    transform: translate3d(97vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(55vw, -107vh, 0);
    transform: translate3d(55vw, -107vh, 0);
  }
  }
  .circle-container:nth-child(124) .circle {
  -webkit-animation-delay: 67ms;
  animation-delay: 67ms;
  }
  .circle-container:nth-child(125) {
  width: 2px;
  height: 2px;
  -webkit-animation-name: move-frames-125;
  animation-name: move-frames-125;
  -webkit-animation-duration: 10941ms;
  animation-duration: 10941ms;
  -webkit-animation-delay: 6333ms;
  animation-delay: 6333ms;
  }
  @-webkit-keyframes move-frames-125 {
  from {
  -webkit-transform: translate3d(43vw, 106vh, 0);
    transform: translate3d(43vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(19vw, -127vh, 0);
    transform: translate3d(19vw, -127vh, 0);
  }
  }
  @keyframes move-frames-125 {
  from {
  -webkit-transform: translate3d(43vw, 106vh, 0);
    transform: translate3d(43vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(19vw, -127vh, 0);
    transform: translate3d(19vw, -127vh, 0);
  }
  }
  .circle-container:nth-child(125) .circle {
  -webkit-animation-delay: 3949ms;
  animation-delay: 3949ms;
  }
  .circle-container:nth-child(126) {
  width: 5px;
  height: 5px;
  -webkit-animation-name: move-frames-126;
  animation-name: move-frames-126;
  -webkit-animation-duration: 10844ms;
  animation-duration: 10844ms;
  -webkit-animation-delay: 4612ms;
  animation-delay: 4612ms;
  }
  @-webkit-keyframes move-frames-126 {
  from {
  -webkit-transform: translate3d(37vw, 103vh, 0);
    transform: translate3d(37vw, 103vh, 0);
  }
  to {
  -webkit-transform: translate3d(1vw, -123vh, 0);
    transform: translate3d(1vw, -123vh, 0);
  }
  }
  @keyframes move-frames-126 {
  from {
  -webkit-transform: translate3d(37vw, 103vh, 0);
    transform: translate3d(37vw, 103vh, 0);
  }
  to {
  -webkit-transform: translate3d(1vw, -123vh, 0);
    transform: translate3d(1vw, -123vh, 0);
  }
  }
  .circle-container:nth-child(126) .circle {
  -webkit-animation-delay: 2673ms;
  animation-delay: 2673ms;
  }
  .circle-container:nth-child(127) {
  width: 1px;
  height: 1px;
  -webkit-animation-name: move-frames-127;
  animation-name: move-frames-127;
  -webkit-animation-duration: 10377ms;
  animation-duration: 10377ms;
  -webkit-animation-delay: 7308ms;
  animation-delay: 7308ms;
  }
  @-webkit-keyframes move-frames-127 {
  from {
  -webkit-transform: translate3d(70vw, 101vh, 0);
    transform: translate3d(70vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(16vw, -114vh, 0);
    transform: translate3d(16vw, -114vh, 0);
  }
  }
  @keyframes move-frames-127 {
  from {
  -webkit-transform: translate3d(70vw, 101vh, 0);
    transform: translate3d(70vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(16vw, -114vh, 0);
    transform: translate3d(16vw, -114vh, 0);
  }
  }
  .circle-container:nth-child(127) .circle {
  -webkit-animation-delay: 1787ms;
  animation-delay: 1787ms;
  }
  .circle-container:nth-child(128) {
  width: 9px;
  height: 9px;
  -webkit-animation-name: move-frames-128;
  animation-name: move-frames-128;
  -webkit-animation-duration: 8543ms;
  animation-duration: 8543ms;
  -webkit-animation-delay: 7446ms;
  animation-delay: 7446ms;
  }
  @-webkit-keyframes move-frames-128 {
  from {
  -webkit-transform: translate3d(10vw, 102vh, 0);
    transform: translate3d(10vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(79vw, -105vh, 0);
    transform: translate3d(79vw, -105vh, 0);
  }
  }
  @keyframes move-frames-128 {
  from {
  -webkit-transform: translate3d(10vw, 102vh, 0);
    transform: translate3d(10vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(79vw, -105vh, 0);
    transform: translate3d(79vw, -105vh, 0);
  }
  }
  .circle-container:nth-child(128) .circle {
  -webkit-animation-delay: 3258ms;
  animation-delay: 3258ms;
  }
  .circle-container:nth-child(129) {
  width: 1px;
  height: 1px;
  -webkit-animation-name: move-frames-129;
  animation-name: move-frames-129;
  -webkit-animation-duration: 9468ms;
  animation-duration: 9468ms;
  -webkit-animation-delay: 2707ms;
  animation-delay: 2707ms;
  }
  @-webkit-keyframes move-frames-129 {
  from {
  -webkit-transform: translate3d(26vw, 104vh, 0);
    transform: translate3d(26vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(33vw, -132vh, 0);
    transform: translate3d(33vw, -132vh, 0);
  }
  }
  @keyframes move-frames-129 {
  from {
  -webkit-transform: translate3d(26vw, 104vh, 0);
    transform: translate3d(26vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(33vw, -132vh, 0);
    transform: translate3d(33vw, -132vh, 0);
  }
  }
  .circle-container:nth-child(129) .circle {
  -webkit-animation-delay: 3283ms;
  animation-delay: 3283ms;
  }
  .circle-container:nth-child(130) {
  width: 2px;
  height: 2px;
  -webkit-animation-name: move-frames-130;
  animation-name: move-frames-130;
  -webkit-animation-duration: 7489ms;
  animation-duration: 7489ms;
  -webkit-animation-delay: 9556ms;
  animation-delay: 9556ms;
  }
  @-webkit-keyframes move-frames-130 {
  from {
  -webkit-transform: translate3d(45vw, 103vh, 0);
    transform: translate3d(45vw, 103vh, 0);
  }
  to {
  -webkit-transform: translate3d(14vw, -129vh, 0);
    transform: translate3d(14vw, -129vh, 0);
  }
  }
  @keyframes move-frames-130 {
  from {
  -webkit-transform: translate3d(45vw, 103vh, 0);
    transform: translate3d(45vw, 103vh, 0);
  }
  to {
  -webkit-transform: translate3d(14vw, -129vh, 0);
    transform: translate3d(14vw, -129vh, 0);
  }
  }
  .circle-container:nth-child(130) .circle {
  -webkit-animation-delay: 1740ms;
  animation-delay: 1740ms;
  }
  .circle-container:nth-child(131) {
  width: 7px;
  height: 7px;
  -webkit-animation-name: move-frames-131;
  animation-name: move-frames-131;
  -webkit-animation-duration: 10221ms;
  animation-duration: 10221ms;
  -webkit-animation-delay: 9258ms;
  animation-delay: 9258ms;
  }
  @-webkit-keyframes move-frames-131 {
  from {
  -webkit-transform: translate3d(95vw, 105vh, 0);
    transform: translate3d(95vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(50vw, -117vh, 0);
    transform: translate3d(50vw, -117vh, 0);
  }
  }
  @keyframes move-frames-131 {
  from {
  -webkit-transform: translate3d(95vw, 105vh, 0);
    transform: translate3d(95vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(50vw, -117vh, 0);
    transform: translate3d(50vw, -117vh, 0);
  }
  }
  .circle-container:nth-child(131) .circle {
  -webkit-animation-delay: 2395ms;
  animation-delay: 2395ms;
  }
  .circle-container:nth-child(132) {
  width: 3px;
  height: 3px;
  -webkit-animation-name: move-frames-132;
  animation-name: move-frames-132;
  -webkit-animation-duration: 8634ms;
  animation-duration: 8634ms;
  -webkit-animation-delay: 1681ms;
  animation-delay: 1681ms;
  }
  @-webkit-keyframes move-frames-132 {
  from {
  -webkit-transform: translate3d(90vw, 110vh, 0);
    transform: translate3d(90vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(97vw, -131vh, 0);
    transform: translate3d(97vw, -131vh, 0);
  }
  }
  @keyframes move-frames-132 {
  from {
  -webkit-transform: translate3d(90vw, 110vh, 0);
    transform: translate3d(90vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(97vw, -131vh, 0);
    transform: translate3d(97vw, -131vh, 0);
  }
  }
  .circle-container:nth-child(132) .circle {
  -webkit-animation-delay: 2701ms;
  animation-delay: 2701ms;
  }
  .circle-container:nth-child(133) {
  width: 2px;
  height: 2px;
  -webkit-animation-name: move-frames-133;
  animation-name: move-frames-133;
  -webkit-animation-duration: 7351ms;
  animation-duration: 7351ms;
  -webkit-animation-delay: 3449ms;
  animation-delay: 3449ms;
  }
  @-webkit-keyframes move-frames-133 {
  from {
  -webkit-transform: translate3d(55vw, 106vh, 0);
    transform: translate3d(55vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(65vw, -129vh, 0);
    transform: translate3d(65vw, -129vh, 0);
  }
  }
  @keyframes move-frames-133 {
  from {
  -webkit-transform: translate3d(55vw, 106vh, 0);
    transform: translate3d(55vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(65vw, -129vh, 0);
    transform: translate3d(65vw, -129vh, 0);
  }
  }
  .circle-container:nth-child(133) .circle {
  -webkit-animation-delay: 2587ms;
  animation-delay: 2587ms;
  }
  .circle-container:nth-child(134) {
  width: 9px;
  height: 9px;
  -webkit-animation-name: move-frames-134;
  animation-name: move-frames-134;
  -webkit-animation-duration: 10483ms;
  animation-duration: 10483ms;
  -webkit-animation-delay: 8838ms;
  animation-delay: 8838ms;
  }
  @-webkit-keyframes move-frames-134 {
  from {
  -webkit-transform: translate3d(84vw, 109vh, 0);
    transform: translate3d(84vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(98vw, -137vh, 0);
    transform: translate3d(98vw, -137vh, 0);
  }
  }
  @keyframes move-frames-134 {
  from {
  -webkit-transform: translate3d(84vw, 109vh, 0);
    transform: translate3d(84vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(98vw, -137vh, 0);
    transform: translate3d(98vw, -137vh, 0);
  }
  }
  .circle-container:nth-child(134) .circle {
  -webkit-animation-delay: 289ms;
  animation-delay: 289ms;
  }
  .circle-container:nth-child(135) {
  width: 7px;
  height: 7px;
  -webkit-animation-name: move-frames-135;
  animation-name: move-frames-135;
  -webkit-animation-duration: 9796ms;
  animation-duration: 9796ms;
  -webkit-animation-delay: 10852ms;
  animation-delay: 10852ms;
  }
  @-webkit-keyframes move-frames-135 {
  from {
  -webkit-transform: translate3d(71vw, 101vh, 0);
    transform: translate3d(71vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(93vw, -103vh, 0);
    transform: translate3d(93vw, -103vh, 0);
  }
  }
  @keyframes move-frames-135 {
  from {
  -webkit-transform: translate3d(71vw, 101vh, 0);
    transform: translate3d(71vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(93vw, -103vh, 0);
    transform: translate3d(93vw, -103vh, 0);
  }
  }
  .circle-container:nth-child(135) .circle {
  -webkit-animation-delay: 3803ms;
  animation-delay: 3803ms;
  }
  .circle-container:nth-child(136) {
  width: 1px;
  height: 1px;
  -webkit-animation-name: move-frames-136;
  animation-name: move-frames-136;
  -webkit-animation-duration: 9439ms;
  animation-duration: 9439ms;
  -webkit-animation-delay: 6657ms;
  animation-delay: 6657ms;
  }
  @-webkit-keyframes move-frames-136 {
  from {
  -webkit-transform: translate3d(52vw, 110vh, 0);
    transform: translate3d(52vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(31vw, -134vh, 0);
    transform: translate3d(31vw, -134vh, 0);
  }
  }
  @keyframes move-frames-136 {
  from {
  -webkit-transform: translate3d(52vw, 110vh, 0);
    transform: translate3d(52vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(31vw, -134vh, 0);
    transform: translate3d(31vw, -134vh, 0);
  }
  }
  .circle-container:nth-child(136) .circle {
  -webkit-animation-delay: 3454ms;
  animation-delay: 3454ms;
  }
  .circle-container:nth-child(137) {
  width: 4px;
  height: 4px;
  -webkit-animation-name: move-frames-137;
  animation-name: move-frames-137;
  -webkit-animation-duration: 10353ms;
  animation-duration: 10353ms;
  -webkit-animation-delay: 10189ms;
  animation-delay: 10189ms;
  }
  @-webkit-keyframes move-frames-137 {
  from {
  -webkit-transform: translate3d(28vw, 102vh, 0);
    transform: translate3d(28vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(14vw, -129vh, 0);
    transform: translate3d(14vw, -129vh, 0);
  }
  }
  @keyframes move-frames-137 {
  from {
  -webkit-transform: translate3d(28vw, 102vh, 0);
    transform: translate3d(28vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(14vw, -129vh, 0);
    transform: translate3d(14vw, -129vh, 0);
  }
  }
  .circle-container:nth-child(137) .circle {
  -webkit-animation-delay: 3086ms;
  animation-delay: 3086ms;
  }
  .circle-container:nth-child(138) {
  width: 5px;
  height: 5px;
  -webkit-animation-name: move-frames-138;
  animation-name: move-frames-138;
  -webkit-animation-duration: 10221ms;
  animation-duration: 10221ms;
  -webkit-animation-delay: 7210ms;
  animation-delay: 7210ms;
  }
  @-webkit-keyframes move-frames-138 {
  from {
  -webkit-transform: translate3d(44vw, 107vh, 0);
    transform: translate3d(44vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(20vw, -108vh, 0);
    transform: translate3d(20vw, -108vh, 0);
  }
  }
  @keyframes move-frames-138 {
  from {
  -webkit-transform: translate3d(44vw, 107vh, 0);
    transform: translate3d(44vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(20vw, -108vh, 0);
    transform: translate3d(20vw, -108vh, 0);
  }
  }
  .circle-container:nth-child(138) .circle {
  -webkit-animation-delay: 670ms;
  animation-delay: 670ms;
  }
  .circle-container:nth-child(139) {
  width: 5px;
  height: 5px;
  -webkit-animation-name: move-frames-139;
  animation-name: move-frames-139;
  -webkit-animation-duration: 8579ms;
  animation-duration: 8579ms;
  -webkit-animation-delay: 542ms;
  animation-delay: 542ms;
  }
  @-webkit-keyframes move-frames-139 {
  from {
  -webkit-transform: translate3d(50vw, 108vh, 0);
    transform: translate3d(50vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(5vw, -114vh, 0);
    transform: translate3d(5vw, -114vh, 0);
  }
  }
  @keyframes move-frames-139 {
  from {
  -webkit-transform: translate3d(50vw, 108vh, 0);
    transform: translate3d(50vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(5vw, -114vh, 0);
    transform: translate3d(5vw, -114vh, 0);
  }
  }
  .circle-container:nth-child(139) .circle {
  -webkit-animation-delay: 3404ms;
  animation-delay: 3404ms;
  }
  .circle-container:nth-child(140) {
  width: 8px;
  height: 8px;
  -webkit-animation-name: move-frames-140;
  animation-name: move-frames-140;
  -webkit-animation-duration: 8957ms;
  animation-duration: 8957ms;
  -webkit-animation-delay: 5236ms;
  animation-delay: 5236ms;
  }
  @-webkit-keyframes move-frames-140 {
  from {
  -webkit-transform: translate3d(63vw, 105vh, 0);
    transform: translate3d(63vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(22vw, -120vh, 0);
    transform: translate3d(22vw, -120vh, 0);
  }
  }
  @keyframes move-frames-140 {
  from {
  -webkit-transform: translate3d(63vw, 105vh, 0);
    transform: translate3d(63vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(22vw, -120vh, 0);
    transform: translate3d(22vw, -120vh, 0);
  }
  }
  .circle-container:nth-child(140) .circle {
  -webkit-animation-delay: 3372ms;
  animation-delay: 3372ms;
  }
  .circle-container:nth-child(141) {
  width: 8px;
  height: 8px;
  -webkit-animation-name: move-frames-141;
  animation-name: move-frames-141;
  -webkit-animation-duration: 7185ms;
  animation-duration: 7185ms;
  -webkit-animation-delay: 9467ms;
  animation-delay: 9467ms;
  }
  @-webkit-keyframes move-frames-141 {
  from {
  -webkit-transform: translate3d(15vw, 106vh, 0);
    transform: translate3d(15vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(23vw, -126vh, 0);
    transform: translate3d(23vw, -126vh, 0);
  }
  }
  @keyframes move-frames-141 {
  from {
  -webkit-transform: translate3d(15vw, 106vh, 0);
    transform: translate3d(15vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(23vw, -126vh, 0);
    transform: translate3d(23vw, -126vh, 0);
  }
  }
  .circle-container:nth-child(141) .circle {
  -webkit-animation-delay: 2444ms;
  animation-delay: 2444ms;
  }
  .circle-container:nth-child(142) {
  width: 1px;
  height: 1px;
  -webkit-animation-name: move-frames-142;
  animation-name: move-frames-142;
  -webkit-animation-duration: 7400ms;
  animation-duration: 7400ms;
  -webkit-animation-delay: 5527ms;
  animation-delay: 5527ms;
  }
  @-webkit-keyframes move-frames-142 {
  from {
  -webkit-transform: translate3d(55vw, 107vh, 0);
    transform: translate3d(55vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(45vw, -109vh, 0);
    transform: translate3d(45vw, -109vh, 0);
  }
  }
  @keyframes move-frames-142 {
  from {
  -webkit-transform: translate3d(55vw, 107vh, 0);
    transform: translate3d(55vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(45vw, -109vh, 0);
    transform: translate3d(45vw, -109vh, 0);
  }
  }
  .circle-container:nth-child(142) .circle {
  -webkit-animation-delay: 966ms;
  animation-delay: 966ms;
  }
  .circle-container:nth-child(143) {
  width: 8px;
  height: 8px;
  -webkit-animation-name: move-frames-143;
  animation-name: move-frames-143;
  -webkit-animation-duration: 7743ms;
  animation-duration: 7743ms;
  -webkit-animation-delay: 9193ms;
  animation-delay: 9193ms;
  }
  @-webkit-keyframes move-frames-143 {
  from {
  -webkit-transform: translate3d(73vw, 103vh, 0);
    transform: translate3d(73vw, 103vh, 0);
  }
  to {
  -webkit-transform: translate3d(44vw, -127vh, 0);
    transform: translate3d(44vw, -127vh, 0);
  }
  }
  @keyframes move-frames-143 {
  from {
  -webkit-transform: translate3d(73vw, 103vh, 0);
    transform: translate3d(73vw, 103vh, 0);
  }
  to {
  -webkit-transform: translate3d(44vw, -127vh, 0);
    transform: translate3d(44vw, -127vh, 0);
  }
  }
  .circle-container:nth-child(143) .circle {
  -webkit-animation-delay: 79ms;
  animation-delay: 79ms;
  }
  .circle-container:nth-child(144) {
  width: 7px;
  height: 7px;
  -webkit-animation-name: move-frames-144;
  animation-name: move-frames-144;
  -webkit-animation-duration: 10720ms;
  animation-duration: 10720ms;
  -webkit-animation-delay: 7913ms;
  animation-delay: 7913ms;
  }
  @-webkit-keyframes move-frames-144 {
  from {
  -webkit-transform: translate3d(38vw, 104vh, 0);
    transform: translate3d(38vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(43vw, -117vh, 0);
    transform: translate3d(43vw, -117vh, 0);
  }
  }
  @keyframes move-frames-144 {
  from {
  -webkit-transform: translate3d(38vw, 104vh, 0);
    transform: translate3d(38vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(43vw, -117vh, 0);
    transform: translate3d(43vw, -117vh, 0);
  }
  }
  .circle-container:nth-child(144) .circle {
  -webkit-animation-delay: 3592ms;
  animation-delay: 3592ms;
  }
  .circle-container:nth-child(145) {
  width: 4px;
  height: 4px;
  -webkit-animation-name: move-frames-145;
  animation-name: move-frames-145;
  -webkit-animation-duration: 9667ms;
  animation-duration: 9667ms;
  -webkit-animation-delay: 9881ms;
  animation-delay: 9881ms;
  }
  @-webkit-keyframes move-frames-145 {
  from {
  -webkit-transform: translate3d(7vw, 109vh, 0);
    transform: translate3d(7vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(70vw, -123vh, 0);
    transform: translate3d(70vw, -123vh, 0);
  }
  }
  @keyframes move-frames-145 {
  from {
  -webkit-transform: translate3d(7vw, 109vh, 0);
    transform: translate3d(7vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(70vw, -123vh, 0);
    transform: translate3d(70vw, -123vh, 0);
  }
  }
  .circle-container:nth-child(145) .circle {
  -webkit-animation-delay: 3827ms;
  animation-delay: 3827ms;
  }
  .circle-container:nth-child(146) {
  width: 7px;
  height: 7px;
  -webkit-animation-name: move-frames-146;
  animation-name: move-frames-146;
  -webkit-animation-duration: 10791ms;
  animation-duration: 10791ms;
  -webkit-animation-delay: 5691ms;
  animation-delay: 5691ms;
  }
  @-webkit-keyframes move-frames-146 {
  from {
  -webkit-transform: translate3d(40vw, 107vh, 0);
    transform: translate3d(40vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(17vw, -116vh, 0);
    transform: translate3d(17vw, -116vh, 0);
  }
  }
  @keyframes move-frames-146 {
  from {
  -webkit-transform: translate3d(40vw, 107vh, 0);
    transform: translate3d(40vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(17vw, -116vh, 0);
    transform: translate3d(17vw, -116vh, 0);
  }
  }
  .circle-container:nth-child(146) .circle {
  -webkit-animation-delay: 855ms;
  animation-delay: 855ms;
  }
  .circle-container:nth-child(147) {
  width: 6px;
  height: 6px;
  -webkit-animation-name: move-frames-147;
  animation-name: move-frames-147;
  -webkit-animation-duration: 8015ms;
  animation-duration: 8015ms;
  -webkit-animation-delay: 850ms;
  animation-delay: 850ms;
  }
  @-webkit-keyframes move-frames-147 {
  from {
  -webkit-transform: translate3d(87vw, 108vh, 0);
    transform: translate3d(87vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(18vw, -122vh, 0);
    transform: translate3d(18vw, -122vh, 0);
  }
  }
  @keyframes move-frames-147 {
  from {
  -webkit-transform: translate3d(87vw, 108vh, 0);
    transform: translate3d(87vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(18vw, -122vh, 0);
    transform: translate3d(18vw, -122vh, 0);
  }
  }
  .circle-container:nth-child(147) .circle {
  -webkit-animation-delay: 3790ms;
  animation-delay: 3790ms;
  }
  .circle-container:nth-child(148) {
  width: 8px;
  height: 8px;
  -webkit-animation-name: move-frames-148;
  animation-name: move-frames-148;
  -webkit-animation-duration: 8558ms;
  animation-duration: 8558ms;
  -webkit-animation-delay: 2807ms;
  animation-delay: 2807ms;
  }
  @-webkit-keyframes move-frames-148 {
  from {
  -webkit-transform: translate3d(34vw, 107vh, 0);
    transform: translate3d(34vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(69vw, -113vh, 0);
    transform: translate3d(69vw, -113vh, 0);
  }
  }
  @keyframes move-frames-148 {
  from {
  -webkit-transform: translate3d(34vw, 107vh, 0);
    transform: translate3d(34vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(69vw, -113vh, 0);
    transform: translate3d(69vw, -113vh, 0);
  }
  }
  .circle-container:nth-child(148) .circle {
  -webkit-animation-delay: 3621ms;
  animation-delay: 3621ms;
  }
  .circle-container:nth-child(149) {
  width: 1px;
  height: 1px;
  -webkit-animation-name: move-frames-149;
  animation-name: move-frames-149;
  -webkit-animation-duration: 7391ms;
  animation-duration: 7391ms;
  -webkit-animation-delay: 7884ms;
  animation-delay: 7884ms;
  }
  @-webkit-keyframes move-frames-149 {
  from {
  -webkit-transform: translate3d(69vw, 101vh, 0);
    transform: translate3d(69vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(44vw, -107vh, 0);
    transform: translate3d(44vw, -107vh, 0);
  }
  }
  @keyframes move-frames-149 {
  from {
  -webkit-transform: translate3d(69vw, 101vh, 0);
    transform: translate3d(69vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(44vw, -107vh, 0);
    transform: translate3d(44vw, -107vh, 0);
  }
  }
  .circle-container:nth-child(149) .circle {
  -webkit-animation-delay: 389ms;
  animation-delay: 389ms;
  }
  .circle-container:nth-child(150) {
  width: 8px;
  height: 8px;
  -webkit-animation-name: move-frames-150;
  animation-name: move-frames-150;
  -webkit-animation-duration: 8840ms;
  animation-duration: 8840ms;
  -webkit-animation-delay: 3781ms;
  animation-delay: 3781ms;
  }
  @-webkit-keyframes move-frames-150 {
  from {
  -webkit-transform: translate3d(23vw, 101vh, 0);
    transform: translate3d(23vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(53vw, -115vh, 0);
    transform: translate3d(53vw, -115vh, 0);
  }
  }
  @keyframes move-frames-150 {
  from {
  -webkit-transform: translate3d(23vw, 101vh, 0);
    transform: translate3d(23vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(53vw, -115vh, 0);
    transform: translate3d(53vw, -115vh, 0);
  }
  }
  .circle-container:nth-child(150) .circle {
  -webkit-animation-delay: 3727ms;
  animation-delay: 3727ms;
  }
  .circle-container:nth-child(151) {
  width: 10px;
  height: 10px;
  -webkit-animation-name: move-frames-151;
  animation-name: move-frames-151;
  -webkit-animation-duration: 9777ms;
  animation-duration: 9777ms;
  -webkit-animation-delay: 10110ms;
  animation-delay: 10110ms;
  }
  @-webkit-keyframes move-frames-151 {
  from {
  -webkit-transform: translate3d(8vw, 101vh, 0);
    transform: translate3d(8vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(55vw, -126vh, 0);
    transform: translate3d(55vw, -126vh, 0);
  }
  }
  @keyframes move-frames-151 {
  from {
  -webkit-transform: translate3d(8vw, 101vh, 0);
    transform: translate3d(8vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(55vw, -126vh, 0);
    transform: translate3d(55vw, -126vh, 0);
  }
  }
  .circle-container:nth-child(151) .circle {
  -webkit-animation-delay: 3406ms;
  animation-delay: 3406ms;
  }
  .circle-container:nth-child(152) {
  width: 7px;
  height: 7px;
  -webkit-animation-name: move-frames-152;
  animation-name: move-frames-152;
  -webkit-animation-duration: 7865ms;
  animation-duration: 7865ms;
  -webkit-animation-delay: 4573ms;
  animation-delay: 4573ms;
  }
  @-webkit-keyframes move-frames-152 {
  from {
  -webkit-transform: translate3d(49vw, 107vh, 0);
    transform: translate3d(49vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(85vw, -125vh, 0);
    transform: translate3d(85vw, -125vh, 0);
  }
  }
  @keyframes move-frames-152 {
  from {
  -webkit-transform: translate3d(49vw, 107vh, 0);
    transform: translate3d(49vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(85vw, -125vh, 0);
    transform: translate3d(85vw, -125vh, 0);
  }
  }
  .circle-container:nth-child(152) .circle {
  -webkit-animation-delay: 2418ms;
  animation-delay: 2418ms;
  }
  .circle-container:nth-child(153) {
  width: 6px;
  height: 6px;
  -webkit-animation-name: move-frames-153;
  animation-name: move-frames-153;
  -webkit-animation-duration: 8269ms;
  animation-duration: 8269ms;
  -webkit-animation-delay: 7324ms;
  animation-delay: 7324ms;
  }
  @-webkit-keyframes move-frames-153 {
  from {
  -webkit-transform: translate3d(88vw, 101vh, 0);
    transform: translate3d(88vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(20vw, -113vh, 0);
    transform: translate3d(20vw, -113vh, 0);
  }
  }
  @keyframes move-frames-153 {
  from {
  -webkit-transform: translate3d(88vw, 101vh, 0);
    transform: translate3d(88vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(20vw, -113vh, 0);
    transform: translate3d(20vw, -113vh, 0);
  }
  }
  .circle-container:nth-child(153) .circle {
  -webkit-animation-delay: 1809ms;
  animation-delay: 1809ms;
  }
  .circle-container:nth-child(154) {
  width: 8px;
  height: 8px;
  -webkit-animation-name: move-frames-154;
  animation-name: move-frames-154;
  -webkit-animation-duration: 7667ms;
  animation-duration: 7667ms;
  -webkit-animation-delay: 4874ms;
  animation-delay: 4874ms;
  }
  @-webkit-keyframes move-frames-154 {
  from {
  -webkit-transform: translate3d(27vw, 105vh, 0);
    transform: translate3d(27vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(22vw, -114vh, 0);
    transform: translate3d(22vw, -114vh, 0);
  }
  }
  @keyframes move-frames-154 {
  from {
  -webkit-transform: translate3d(27vw, 105vh, 0);
    transform: translate3d(27vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(22vw, -114vh, 0);
    transform: translate3d(22vw, -114vh, 0);
  }
  }
  .circle-container:nth-child(154) .circle {
  -webkit-animation-delay: 3688ms;
  animation-delay: 3688ms;
  }
  .circle-container:nth-child(155) {
  width: 5px;
  height: 5px;
  -webkit-animation-name: move-frames-155;
  animation-name: move-frames-155;
  -webkit-animation-duration: 10555ms;
  animation-duration: 10555ms;
  -webkit-animation-delay: 37ms;
  animation-delay: 37ms;
  }
  @-webkit-keyframes move-frames-155 {
  from {
  -webkit-transform: translate3d(27vw, 102vh, 0);
    transform: translate3d(27vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(7vw, -106vh, 0);
    transform: translate3d(7vw, -106vh, 0);
  }
  }
  @keyframes move-frames-155 {
  from {
  -webkit-transform: translate3d(27vw, 102vh, 0);
    transform: translate3d(27vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(7vw, -106vh, 0);
    transform: translate3d(7vw, -106vh, 0);
  }
  }
  .circle-container:nth-child(155) .circle {
  -webkit-animation-delay: 2894ms;
  animation-delay: 2894ms;
  }
  .circle-container:nth-child(156) {
  width: 3px;
  height: 3px;
  -webkit-animation-name: move-frames-156;
  animation-name: move-frames-156;
  -webkit-animation-duration: 10143ms;
  animation-duration: 10143ms;
  -webkit-animation-delay: 3296ms;
  animation-delay: 3296ms;
  }
  @-webkit-keyframes move-frames-156 {
  from {
  -webkit-transform: translate3d(20vw, 101vh, 0);
    transform: translate3d(20vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(18vw, -103vh, 0);
    transform: translate3d(18vw, -103vh, 0);
  }
  }
  @keyframes move-frames-156 {
  from {
  -webkit-transform: translate3d(20vw, 101vh, 0);
    transform: translate3d(20vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(18vw, -103vh, 0);
    transform: translate3d(18vw, -103vh, 0);
  }
  }
  .circle-container:nth-child(156) .circle {
  -webkit-animation-delay: 456ms;
  animation-delay: 456ms;
  }
  .circle-container:nth-child(157) {
  width: 6px;
  height: 6px;
  -webkit-animation-name: move-frames-157;
  animation-name: move-frames-157;
  -webkit-animation-duration: 10369ms;
  animation-duration: 10369ms;
  -webkit-animation-delay: 9790ms;
  animation-delay: 9790ms;
  }
  @-webkit-keyframes move-frames-157 {
  from {
  -webkit-transform: translate3d(18vw, 104vh, 0);
    transform: translate3d(18vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(93vw, -126vh, 0);
    transform: translate3d(93vw, -126vh, 0);
  }
  }
  @keyframes move-frames-157 {
  from {
  -webkit-transform: translate3d(18vw, 104vh, 0);
    transform: translate3d(18vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(93vw, -126vh, 0);
    transform: translate3d(93vw, -126vh, 0);
  }
  }
  .circle-container:nth-child(157) .circle {
  -webkit-animation-delay: 1530ms;
  animation-delay: 1530ms;
  }
  .circle-container:nth-child(158) {
  width: 7px;
  height: 7px;
  -webkit-animation-name: move-frames-158;
  animation-name: move-frames-158;
  -webkit-animation-duration: 7391ms;
  animation-duration: 7391ms;
  -webkit-animation-delay: 7592ms;
  animation-delay: 7592ms;
  }
  @-webkit-keyframes move-frames-158 {
  from {
  -webkit-transform: translate3d(74vw, 105vh, 0);
    transform: translate3d(74vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(15vw, -108vh, 0);
    transform: translate3d(15vw, -108vh, 0);
  }
  }
  @keyframes move-frames-158 {
  from {
  -webkit-transform: translate3d(74vw, 105vh, 0);
    transform: translate3d(74vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(15vw, -108vh, 0);
    transform: translate3d(15vw, -108vh, 0);
  }
  }
  .circle-container:nth-child(158) .circle {
  -webkit-animation-delay: 197ms;
  animation-delay: 197ms;
  }
  .circle-container:nth-child(159) {
  width: 9px;
  height: 9px;
  -webkit-animation-name: move-frames-159;
  animation-name: move-frames-159;
  -webkit-animation-duration: 7347ms;
  animation-duration: 7347ms;
  -webkit-animation-delay: 10820ms;
  animation-delay: 10820ms;
  }
  @-webkit-keyframes move-frames-159 {
  from {
  -webkit-transform: translate3d(22vw, 102vh, 0);
    transform: translate3d(22vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(5vw, -106vh, 0);
    transform: translate3d(5vw, -106vh, 0);
  }
  }
  @keyframes move-frames-159 {
  from {
  -webkit-transform: translate3d(22vw, 102vh, 0);
    transform: translate3d(22vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(5vw, -106vh, 0);
    transform: translate3d(5vw, -106vh, 0);
  }
  }
  .circle-container:nth-child(159) .circle {
  -webkit-animation-delay: 1253ms;
  animation-delay: 1253ms;
  }
  .circle-container:nth-child(160) {
  width: 1px;
  height: 1px;
  -webkit-animation-name: move-frames-160;
  animation-name: move-frames-160;
  -webkit-animation-duration: 7294ms;
  animation-duration: 7294ms;
  -webkit-animation-delay: 9595ms;
  animation-delay: 9595ms;
  }
  @-webkit-keyframes move-frames-160 {
  from {
  -webkit-transform: translate3d(88vw, 105vh, 0);
    transform: translate3d(88vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(70vw, -125vh, 0);
    transform: translate3d(70vw, -125vh, 0);
  }
  }
  @keyframes move-frames-160 {
  from {
  -webkit-transform: translate3d(88vw, 105vh, 0);
    transform: translate3d(88vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(70vw, -125vh, 0);
    transform: translate3d(70vw, -125vh, 0);
  }
  }
  .circle-container:nth-child(160) .circle {
  -webkit-animation-delay: 569ms;
  animation-delay: 569ms;
  }
  .circle-container:nth-child(161) {
  width: 5px;
  height: 5px;
  -webkit-animation-name: move-frames-161;
  animation-name: move-frames-161;
  -webkit-animation-duration: 7483ms;
  animation-duration: 7483ms;
  -webkit-animation-delay: 10982ms;
  animation-delay: 10982ms;
  }
  @-webkit-keyframes move-frames-161 {
  from {
  -webkit-transform: translate3d(30vw, 103vh, 0);
    transform: translate3d(30vw, 103vh, 0);
  }
  to {
  -webkit-transform: translate3d(69vw, -112vh, 0);
    transform: translate3d(69vw, -112vh, 0);
  }
  }
  @keyframes move-frames-161 {
  from {
  -webkit-transform: translate3d(30vw, 103vh, 0);
    transform: translate3d(30vw, 103vh, 0);
  }
  to {
  -webkit-transform: translate3d(69vw, -112vh, 0);
    transform: translate3d(69vw, -112vh, 0);
  }
  }
  .circle-container:nth-child(161) .circle {
  -webkit-animation-delay: 1801ms;
  animation-delay: 1801ms;
  }
  .circle-container:nth-child(162) {
  width: 2px;
  height: 2px;
  -webkit-animation-name: move-frames-162;
  animation-name: move-frames-162;
  -webkit-animation-duration: 7648ms;
  animation-duration: 7648ms;
  -webkit-animation-delay: 3841ms;
  animation-delay: 3841ms;
  }
  @-webkit-keyframes move-frames-162 {
  from {
  -webkit-transform: translate3d(84vw, 105vh, 0);
    transform: translate3d(84vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(41vw, -127vh, 0);
    transform: translate3d(41vw, -127vh, 0);
  }
  }
  @keyframes move-frames-162 {
  from {
  -webkit-transform: translate3d(84vw, 105vh, 0);
    transform: translate3d(84vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(41vw, -127vh, 0);
    transform: translate3d(41vw, -127vh, 0);
  }
  }
  .circle-container:nth-child(162) .circle {
  -webkit-animation-delay: 3266ms;
  animation-delay: 3266ms;
  }
  .circle-container:nth-child(163) {
  width: 9px;
  height: 9px;
  -webkit-animation-name: move-frames-163;
  animation-name: move-frames-163;
  -webkit-animation-duration: 7231ms;
  animation-duration: 7231ms;
  -webkit-animation-delay: 466ms;
  animation-delay: 466ms;
  }
  @-webkit-keyframes move-frames-163 {
  from {
  -webkit-transform: translate3d(12vw, 103vh, 0);
    transform: translate3d(12vw, 103vh, 0);
  }
  to {
  -webkit-transform: translate3d(53vw, -128vh, 0);
    transform: translate3d(53vw, -128vh, 0);
  }
  }
  @keyframes move-frames-163 {
  from {
  -webkit-transform: translate3d(12vw, 103vh, 0);
    transform: translate3d(12vw, 103vh, 0);
  }
  to {
  -webkit-transform: translate3d(53vw, -128vh, 0);
    transform: translate3d(53vw, -128vh, 0);
  }
  }
  .circle-container:nth-child(163) .circle {
  -webkit-animation-delay: 2178ms;
  animation-delay: 2178ms;
  }
  .circle-container:nth-child(164) {
  width: 8px;
  height: 8px;
  -webkit-animation-name: move-frames-164;
  animation-name: move-frames-164;
  -webkit-animation-duration: 8705ms;
  animation-duration: 8705ms;
  -webkit-animation-delay: 4573ms;
  animation-delay: 4573ms;
  }
  @-webkit-keyframes move-frames-164 {
  from {
  -webkit-transform: translate3d(8vw, 102vh, 0);
    transform: translate3d(8vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(14vw, -104vh, 0);
    transform: translate3d(14vw, -104vh, 0);
  }
  }
  @keyframes move-frames-164 {
  from {
  -webkit-transform: translate3d(8vw, 102vh, 0);
    transform: translate3d(8vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(14vw, -104vh, 0);
    transform: translate3d(14vw, -104vh, 0);
  }
  }
  .circle-container:nth-child(164) .circle {
  -webkit-animation-delay: 352ms;
  animation-delay: 352ms;
  }
  .circle-container:nth-child(165) {
  width: 3px;
  height: 3px;
  -webkit-animation-name: move-frames-165;
  animation-name: move-frames-165;
  -webkit-animation-duration: 8091ms;
  animation-duration: 8091ms;
  -webkit-animation-delay: 3901ms;
  animation-delay: 3901ms;
  }
  @-webkit-keyframes move-frames-165 {
  from {
  -webkit-transform: translate3d(84vw, 106vh, 0);
    transform: translate3d(84vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(52vw, -108vh, 0);
    transform: translate3d(52vw, -108vh, 0);
  }
  }
  @keyframes move-frames-165 {
  from {
  -webkit-transform: translate3d(84vw, 106vh, 0);
    transform: translate3d(84vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(52vw, -108vh, 0);
    transform: translate3d(52vw, -108vh, 0);
  }
  }
  .circle-container:nth-child(165) .circle {
  -webkit-animation-delay: 2333ms;
  animation-delay: 2333ms;
  }
  .circle-container:nth-child(166) {
  width: 4px;
  height: 4px;
  -webkit-animation-name: move-frames-166;
  animation-name: move-frames-166;
  -webkit-animation-duration: 9693ms;
  animation-duration: 9693ms;
  -webkit-animation-delay: 6099ms;
  animation-delay: 6099ms;
  }
  @-webkit-keyframes move-frames-166 {
  from {
  -webkit-transform: translate3d(78vw, 107vh, 0);
    transform: translate3d(78vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(38vw, -111vh, 0);
    transform: translate3d(38vw, -111vh, 0);
  }
  }
  @keyframes move-frames-166 {
  from {
  -webkit-transform: translate3d(78vw, 107vh, 0);
    transform: translate3d(78vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(38vw, -111vh, 0);
    transform: translate3d(38vw, -111vh, 0);
  }
  }
  .circle-container:nth-child(166) .circle {
  -webkit-animation-delay: 1118ms;
  animation-delay: 1118ms;
  }
  .circle-container:nth-child(167) {
  width: 7px;
  height: 7px;
  -webkit-animation-name: move-frames-167;
  animation-name: move-frames-167;
  -webkit-animation-duration: 9033ms;
  animation-duration: 9033ms;
  -webkit-animation-delay: 1903ms;
  animation-delay: 1903ms;
  }
  @-webkit-keyframes move-frames-167 {
  from {
  -webkit-transform: translate3d(93vw, 108vh, 0);
    transform: translate3d(93vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(33vw, -127vh, 0);
    transform: translate3d(33vw, -127vh, 0);
  }
  }
  @keyframes move-frames-167 {
  from {
  -webkit-transform: translate3d(93vw, 108vh, 0);
    transform: translate3d(93vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(33vw, -127vh, 0);
    transform: translate3d(33vw, -127vh, 0);
  }
  }
  .circle-container:nth-child(167) .circle {
  -webkit-animation-delay: 3229ms;
  animation-delay: 3229ms;
  }
  .circle-container:nth-child(168) {
  width: 1px;
  height: 1px;
  -webkit-animation-name: move-frames-168;
  animation-name: move-frames-168;
  -webkit-animation-duration: 8360ms;
  animation-duration: 8360ms;
  -webkit-animation-delay: 8244ms;
  animation-delay: 8244ms;
  }
  @-webkit-keyframes move-frames-168 {
  from {
  -webkit-transform: translate3d(7vw, 105vh, 0);
    transform: translate3d(7vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(79vw, -108vh, 0);
    transform: translate3d(79vw, -108vh, 0);
  }
  }
  @keyframes move-frames-168 {
  from {
  -webkit-transform: translate3d(7vw, 105vh, 0);
    transform: translate3d(7vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(79vw, -108vh, 0);
    transform: translate3d(79vw, -108vh, 0);
  }
  }
  .circle-container:nth-child(168) .circle {
  -webkit-animation-delay: 1552ms;
  animation-delay: 1552ms;
  }
  .circle-container:nth-child(169) {
  width: 10px;
  height: 10px;
  -webkit-animation-name: move-frames-169;
  animation-name: move-frames-169;
  -webkit-animation-duration: 8642ms;
  animation-duration: 8642ms;
  -webkit-animation-delay: 3989ms;
  animation-delay: 3989ms;
  }
  @-webkit-keyframes move-frames-169 {
  from {
  -webkit-transform: translate3d(33vw, 104vh, 0);
    transform: translate3d(33vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(6vw, -122vh, 0);
    transform: translate3d(6vw, -122vh, 0);
  }
  }
  @keyframes move-frames-169 {
  from {
  -webkit-transform: translate3d(33vw, 104vh, 0);
    transform: translate3d(33vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(6vw, -122vh, 0);
    transform: translate3d(6vw, -122vh, 0);
  }
  }
  .circle-container:nth-child(169) .circle {
  -webkit-animation-delay: 1116ms;
  animation-delay: 1116ms;
  }
  .circle-container:nth-child(170) {
  width: 7px;
  height: 7px;
  -webkit-animation-name: move-frames-170;
  animation-name: move-frames-170;
  -webkit-animation-duration: 9107ms;
  animation-duration: 9107ms;
  -webkit-animation-delay: 655ms;
  animation-delay: 655ms;
  }
  @-webkit-keyframes move-frames-170 {
  from {
  -webkit-transform: translate3d(85vw, 104vh, 0);
    transform: translate3d(85vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(6vw, -112vh, 0);
    transform: translate3d(6vw, -112vh, 0);
  }
  }
  @keyframes move-frames-170 {
  from {
  -webkit-transform: translate3d(85vw, 104vh, 0);
    transform: translate3d(85vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(6vw, -112vh, 0);
    transform: translate3d(6vw, -112vh, 0);
  }
  }
  .circle-container:nth-child(170) .circle {
  -webkit-animation-delay: 2983ms;
  animation-delay: 2983ms;
  }
  .circle-container:nth-child(171) {
  width: 7px;
  height: 7px;
  -webkit-animation-name: move-frames-171;
  animation-name: move-frames-171;
  -webkit-animation-duration: 10755ms;
  animation-duration: 10755ms;
  -webkit-animation-delay: 10396ms;
  animation-delay: 10396ms;
  }
  @-webkit-keyframes move-frames-171 {
  from {
  -webkit-transform: translate3d(83vw, 108vh, 0);
    transform: translate3d(83vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(64vw, -116vh, 0);
    transform: translate3d(64vw, -116vh, 0);
  }
  }
  @keyframes move-frames-171 {
  from {
  -webkit-transform: translate3d(83vw, 108vh, 0);
    transform: translate3d(83vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(64vw, -116vh, 0);
    transform: translate3d(64vw, -116vh, 0);
  }
  }
  .circle-container:nth-child(171) .circle {
  -webkit-animation-delay: 146ms;
  animation-delay: 146ms;
  }
  .circle-container:nth-child(172) {
  width: 10px;
  height: 10px;
  -webkit-animation-name: move-frames-172;
  animation-name: move-frames-172;
  -webkit-animation-duration: 9275ms;
  animation-duration: 9275ms;
  -webkit-animation-delay: 7768ms;
  animation-delay: 7768ms;
  }
  @-webkit-keyframes move-frames-172 {
  from {
  -webkit-transform: translate3d(75vw, 104vh, 0);
    transform: translate3d(75vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(14vw, -120vh, 0);
    transform: translate3d(14vw, -120vh, 0);
  }
  }
  @keyframes move-frames-172 {
  from {
  -webkit-transform: translate3d(75vw, 104vh, 0);
    transform: translate3d(75vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(14vw, -120vh, 0);
    transform: translate3d(14vw, -120vh, 0);
  }
  }
  .circle-container:nth-child(172) .circle {
  -webkit-animation-delay: 2976ms;
  animation-delay: 2976ms;
  }
  .circle-container:nth-child(173) {
  width: 8px;
  height: 8px;
  -webkit-animation-name: move-frames-173;
  animation-name: move-frames-173;
  -webkit-animation-duration: 8634ms;
  animation-duration: 8634ms;
  -webkit-animation-delay: 2179ms;
  animation-delay: 2179ms;
  }
  @-webkit-keyframes move-frames-173 {
  from {
  -webkit-transform: translate3d(78vw, 106vh, 0);
    transform: translate3d(78vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(44vw, -126vh, 0);
    transform: translate3d(44vw, -126vh, 0);
  }
  }
  @keyframes move-frames-173 {
  from {
  -webkit-transform: translate3d(78vw, 106vh, 0);
    transform: translate3d(78vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(44vw, -126vh, 0);
    transform: translate3d(44vw, -126vh, 0);
  }
  }
  .circle-container:nth-child(173) .circle {
  -webkit-animation-delay: 1807ms;
  animation-delay: 1807ms;
  }
  .circle-container:nth-child(174) {
  width: 3px;
  height: 3px;
  -webkit-animation-name: move-frames-174;
  animation-name: move-frames-174;
  -webkit-animation-duration: 7890ms;
  animation-duration: 7890ms;
  -webkit-animation-delay: 924ms;
  animation-delay: 924ms;
  }
  @-webkit-keyframes move-frames-174 {
  from {
  -webkit-transform: translate3d(32vw, 101vh, 0);
    transform: translate3d(32vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(65vw, -126vh, 0);
    transform: translate3d(65vw, -126vh, 0);
  }
  }
  @keyframes move-frames-174 {
  from {
  -webkit-transform: translate3d(32vw, 101vh, 0);
    transform: translate3d(32vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(65vw, -126vh, 0);
    transform: translate3d(65vw, -126vh, 0);
  }
  }
  .circle-container:nth-child(174) .circle {
  -webkit-animation-delay: 2869ms;
  animation-delay: 2869ms;
  }
  .circle-container:nth-child(175) {
  width: 9px;
  height: 9px;
  -webkit-animation-name: move-frames-175;
  animation-name: move-frames-175;
  -webkit-animation-duration: 8573ms;
  animation-duration: 8573ms;
  -webkit-animation-delay: 829ms;
  animation-delay: 829ms;
  }
  @-webkit-keyframes move-frames-175 {
  from {
  -webkit-transform: translate3d(7vw, 110vh, 0);
    transform: translate3d(7vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(86vw, -118vh, 0);
    transform: translate3d(86vw, -118vh, 0);
  }
  }
  @keyframes move-frames-175 {
  from {
  -webkit-transform: translate3d(7vw, 110vh, 0);
    transform: translate3d(7vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(86vw, -118vh, 0);
    transform: translate3d(86vw, -118vh, 0);
  }
  }
  .circle-container:nth-child(175) .circle {
  -webkit-animation-delay: 1685ms;
  animation-delay: 1685ms;
  }
  .circle-container:nth-child(176) {
  width: 10px;
  height: 10px;
  -webkit-animation-name: move-frames-176;
  animation-name: move-frames-176;
  -webkit-animation-duration: 9613ms;
  animation-duration: 9613ms;
  -webkit-animation-delay: 1689ms;
  animation-delay: 1689ms;
  }
  @-webkit-keyframes move-frames-176 {
  from {
  -webkit-transform: translate3d(85vw, 101vh, 0);
    transform: translate3d(85vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(27vw, -127vh, 0);
    transform: translate3d(27vw, -127vh, 0);
  }
  }
  @keyframes move-frames-176 {
  from {
  -webkit-transform: translate3d(85vw, 101vh, 0);
    transform: translate3d(85vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(27vw, -127vh, 0);
    transform: translate3d(27vw, -127vh, 0);
  }
  }
  .circle-container:nth-child(176) .circle {
  -webkit-animation-delay: 3298ms;
  animation-delay: 3298ms;
  }
  .circle-container:nth-child(177) {
  width: 4px;
  height: 4px;
  -webkit-animation-name: move-frames-177;
  animation-name: move-frames-177;
  -webkit-animation-duration: 8876ms;
  animation-duration: 8876ms;
  -webkit-animation-delay: 3252ms;
  animation-delay: 3252ms;
  }
  @-webkit-keyframes move-frames-177 {
  from {
  -webkit-transform: translate3d(16vw, 106vh, 0);
    transform: translate3d(16vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(8vw, -117vh, 0);
    transform: translate3d(8vw, -117vh, 0);
  }
  }
  @keyframes move-frames-177 {
  from {
  -webkit-transform: translate3d(16vw, 106vh, 0);
    transform: translate3d(16vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(8vw, -117vh, 0);
    transform: translate3d(8vw, -117vh, 0);
  }
  }
  .circle-container:nth-child(177) .circle {
  -webkit-animation-delay: 3262ms;
  animation-delay: 3262ms;
  }
  .circle-container:nth-child(178) {
  width: 4px;
  height: 4px;
  -webkit-animation-name: move-frames-178;
  animation-name: move-frames-178;
  -webkit-animation-duration: 7741ms;
  animation-duration: 7741ms;
  -webkit-animation-delay: 1829ms;
  animation-delay: 1829ms;
  }
  @-webkit-keyframes move-frames-178 {
  from {
  -webkit-transform: translate3d(8vw, 102vh, 0);
    transform: translate3d(8vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(91vw, -123vh, 0);
    transform: translate3d(91vw, -123vh, 0);
  }
  }
  @keyframes move-frames-178 {
  from {
  -webkit-transform: translate3d(8vw, 102vh, 0);
    transform: translate3d(8vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(91vw, -123vh, 0);
    transform: translate3d(91vw, -123vh, 0);
  }
  }
  .circle-container:nth-child(178) .circle {
  -webkit-animation-delay: 628ms;
  animation-delay: 628ms;
  }
  .circle-container:nth-child(179) {
  width: 10px;
  height: 10px;
  -webkit-animation-name: move-frames-179;
  animation-name: move-frames-179;
  -webkit-animation-duration: 10722ms;
  animation-duration: 10722ms;
  -webkit-animation-delay: 4451ms;
  animation-delay: 4451ms;
  }
  @-webkit-keyframes move-frames-179 {
  from {
  -webkit-transform: translate3d(44vw, 101vh, 0);
    transform: translate3d(44vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(71vw, -117vh, 0);
    transform: translate3d(71vw, -117vh, 0);
  }
  }
  @keyframes move-frames-179 {
  from {
  -webkit-transform: translate3d(44vw, 101vh, 0);
    transform: translate3d(44vw, 101vh, 0);
  }
  to {
  -webkit-transform: translate3d(71vw, -117vh, 0);
    transform: translate3d(71vw, -117vh, 0);
  }
  }
  .circle-container:nth-child(179) .circle {
  -webkit-animation-delay: 2717ms;
  animation-delay: 2717ms;
  }
  .circle-container:nth-child(180) {
  width: 6px;
  height: 6px;
  -webkit-animation-name: move-frames-180;
  animation-name: move-frames-180;
  -webkit-animation-duration: 8662ms;
  animation-duration: 8662ms;
  -webkit-animation-delay: 10529ms;
  animation-delay: 10529ms;
  }
  @-webkit-keyframes move-frames-180 {
  from {
  -webkit-transform: translate3d(35vw, 105vh, 0);
    transform: translate3d(35vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(64vw, -107vh, 0);
    transform: translate3d(64vw, -107vh, 0);
  }
  }
  @keyframes move-frames-180 {
  from {
  -webkit-transform: translate3d(35vw, 105vh, 0);
    transform: translate3d(35vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(64vw, -107vh, 0);
    transform: translate3d(64vw, -107vh, 0);
  }
  }
  .circle-container:nth-child(180) .circle {
  -webkit-animation-delay: 2530ms;
  animation-delay: 2530ms;
  }
  .circle-container:nth-child(181) {
  width: 1px;
  height: 1px;
  -webkit-animation-name: move-frames-181;
  animation-name: move-frames-181;
  -webkit-animation-duration: 8549ms;
  animation-duration: 8549ms;
  -webkit-animation-delay: 6293ms;
  animation-delay: 6293ms;
  }
  @-webkit-keyframes move-frames-181 {
  from {
  -webkit-transform: translate3d(59vw, 105vh, 0);
    transform: translate3d(59vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(5vw, -113vh, 0);
    transform: translate3d(5vw, -113vh, 0);
  }
  }
  @keyframes move-frames-181 {
  from {
  -webkit-transform: translate3d(59vw, 105vh, 0);
    transform: translate3d(59vw, 105vh, 0);
  }
  to {
  -webkit-transform: translate3d(5vw, -113vh, 0);
    transform: translate3d(5vw, -113vh, 0);
  }
  }
  .circle-container:nth-child(181) .circle {
  -webkit-animation-delay: 3933ms;
  animation-delay: 3933ms;
  }
  .circle-container:nth-child(182) {
  width: 4px;
  height: 4px;
  -webkit-animation-name: move-frames-182;
  animation-name: move-frames-182;
  -webkit-animation-duration: 7961ms;
  animation-duration: 7961ms;
  -webkit-animation-delay: 3713ms;
  animation-delay: 3713ms;
  }
  @-webkit-keyframes move-frames-182 {
  from {
  -webkit-transform: translate3d(36vw, 109vh, 0);
    transform: translate3d(36vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(31vw, -129vh, 0);
    transform: translate3d(31vw, -129vh, 0);
  }
  }
  @keyframes move-frames-182 {
  from {
  -webkit-transform: translate3d(36vw, 109vh, 0);
    transform: translate3d(36vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(31vw, -129vh, 0);
    transform: translate3d(31vw, -129vh, 0);
  }
  }
  .circle-container:nth-child(182) .circle {
  -webkit-animation-delay: 3838ms;
  animation-delay: 3838ms;
  }
  .circle-container:nth-child(183) {
  width: 2px;
  height: 2px;
  -webkit-animation-name: move-frames-183;
  animation-name: move-frames-183;
  -webkit-animation-duration: 10258ms;
  animation-duration: 10258ms;
  -webkit-animation-delay: 1392ms;
  animation-delay: 1392ms;
  }
  @-webkit-keyframes move-frames-183 {
  from {
  -webkit-transform: translate3d(94vw, 104vh, 0);
    transform: translate3d(94vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(99vw, -131vh, 0);
    transform: translate3d(99vw, -131vh, 0);
  }
  }
  @keyframes move-frames-183 {
  from {
  -webkit-transform: translate3d(94vw, 104vh, 0);
    transform: translate3d(94vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(99vw, -131vh, 0);
    transform: translate3d(99vw, -131vh, 0);
  }
  }
  .circle-container:nth-child(183) .circle {
  -webkit-animation-delay: 2550ms;
  animation-delay: 2550ms;
  }
  .circle-container:nth-child(184) {
  width: 8px;
  height: 8px;
  -webkit-animation-name: move-frames-184;
  animation-name: move-frames-184;
  -webkit-animation-duration: 10981ms;
  animation-duration: 10981ms;
  -webkit-animation-delay: 4258ms;
  animation-delay: 4258ms;
  }
  @-webkit-keyframes move-frames-184 {
  from {
  -webkit-transform: translate3d(43vw, 109vh, 0);
    transform: translate3d(43vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(23vw, -116vh, 0);
    transform: translate3d(23vw, -116vh, 0);
  }
  }
  @keyframes move-frames-184 {
  from {
  -webkit-transform: translate3d(43vw, 109vh, 0);
    transform: translate3d(43vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(23vw, -116vh, 0);
    transform: translate3d(23vw, -116vh, 0);
  }
  }
  .circle-container:nth-child(184) .circle {
  -webkit-animation-delay: 1084ms;
  animation-delay: 1084ms;
  }
  .circle-container:nth-child(185) {
  width: 10px;
  height: 10px;
  -webkit-animation-name: move-frames-185;
  animation-name: move-frames-185;
  -webkit-animation-duration: 8555ms;
  animation-duration: 8555ms;
  -webkit-animation-delay: 4329ms;
  animation-delay: 4329ms;
  }
  @-webkit-keyframes move-frames-185 {
  from {
  -webkit-transform: translate3d(90vw, 110vh, 0);
    transform: translate3d(90vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(43vw, -131vh, 0);
    transform: translate3d(43vw, -131vh, 0);
  }
  }
  @keyframes move-frames-185 {
  from {
  -webkit-transform: translate3d(90vw, 110vh, 0);
    transform: translate3d(90vw, 110vh, 0);
  }
  to {
  -webkit-transform: translate3d(43vw, -131vh, 0);
    transform: translate3d(43vw, -131vh, 0);
  }
  }
  .circle-container:nth-child(185) .circle {
  -webkit-animation-delay: 901ms;
  animation-delay: 901ms;
  }
  .circle-container:nth-child(186) {
  width: 3px;
  height: 3px;
  -webkit-animation-name: move-frames-186;
  animation-name: move-frames-186;
  -webkit-animation-duration: 7768ms;
  animation-duration: 7768ms;
  -webkit-animation-delay: 2323ms;
  animation-delay: 2323ms;
  }
  @-webkit-keyframes move-frames-186 {
  from {
  -webkit-transform: translate3d(1vw, 102vh, 0);
    transform: translate3d(1vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(67vw, -130vh, 0);
    transform: translate3d(67vw, -130vh, 0);
  }
  }
  @keyframes move-frames-186 {
  from {
  -webkit-transform: translate3d(1vw, 102vh, 0);
    transform: translate3d(1vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(67vw, -130vh, 0);
    transform: translate3d(67vw, -130vh, 0);
  }
  }
  .circle-container:nth-child(186) .circle {
  -webkit-animation-delay: 3982ms;
  animation-delay: 3982ms;
  }
  .circle-container:nth-child(187) {
  width: 7px;
  height: 7px;
  -webkit-animation-name: move-frames-187;
  animation-name: move-frames-187;
  -webkit-animation-duration: 9542ms;
  animation-duration: 9542ms;
  -webkit-animation-delay: 6076ms;
  animation-delay: 6076ms;
  }
  @-webkit-keyframes move-frames-187 {
  from {
  -webkit-transform: translate3d(56vw, 104vh, 0);
    transform: translate3d(56vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(1vw, -127vh, 0);
    transform: translate3d(1vw, -127vh, 0);
  }
  }
  @keyframes move-frames-187 {
  from {
  -webkit-transform: translate3d(56vw, 104vh, 0);
    transform: translate3d(56vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(1vw, -127vh, 0);
    transform: translate3d(1vw, -127vh, 0);
  }
  }
  .circle-container:nth-child(187) .circle {
  -webkit-animation-delay: 1928ms;
  animation-delay: 1928ms;
  }
  .circle-container:nth-child(188) {
  width: 5px;
  height: 5px;
  -webkit-animation-name: move-frames-188;
  animation-name: move-frames-188;
  -webkit-animation-duration: 7878ms;
  animation-duration: 7878ms;
  -webkit-animation-delay: 2740ms;
  animation-delay: 2740ms;
  }
  @-webkit-keyframes move-frames-188 {
  from {
  -webkit-transform: translate3d(19vw, 104vh, 0);
    transform: translate3d(19vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(26vw, -127vh, 0);
    transform: translate3d(26vw, -127vh, 0);
  }
  }
  @keyframes move-frames-188 {
  from {
  -webkit-transform: translate3d(19vw, 104vh, 0);
    transform: translate3d(19vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(26vw, -127vh, 0);
    transform: translate3d(26vw, -127vh, 0);
  }
  }
  .circle-container:nth-child(188) .circle {
  -webkit-animation-delay: 2532ms;
  animation-delay: 2532ms;
  }
  .circle-container:nth-child(189) {
  width: 6px;
  height: 6px;
  -webkit-animation-name: move-frames-189;
  animation-name: move-frames-189;
  -webkit-animation-duration: 8011ms;
  animation-duration: 8011ms;
  -webkit-animation-delay: 4310ms;
  animation-delay: 4310ms;
  }
  @-webkit-keyframes move-frames-189 {
  from {
  -webkit-transform: translate3d(55vw, 108vh, 0);
    transform: translate3d(55vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(96vw, -130vh, 0);
    transform: translate3d(96vw, -130vh, 0);
  }
  }
  @keyframes move-frames-189 {
  from {
  -webkit-transform: translate3d(55vw, 108vh, 0);
    transform: translate3d(55vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(96vw, -130vh, 0);
    transform: translate3d(96vw, -130vh, 0);
  }
  }
  .circle-container:nth-child(189) .circle {
  -webkit-animation-delay: 2308ms;
  animation-delay: 2308ms;
  }
  .circle-container:nth-child(190) {
  width: 6px;
  height: 6px;
  -webkit-animation-name: move-frames-190;
  animation-name: move-frames-190;
  -webkit-animation-duration: 9477ms;
  animation-duration: 9477ms;
  -webkit-animation-delay: 9959ms;
  animation-delay: 9959ms;
  }
  @-webkit-keyframes move-frames-190 {
  from {
  -webkit-transform: translate3d(62vw, 104vh, 0);
    transform: translate3d(62vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(48vw, -124vh, 0);
    transform: translate3d(48vw, -124vh, 0);
  }
  }
  @keyframes move-frames-190 {
  from {
  -webkit-transform: translate3d(62vw, 104vh, 0);
    transform: translate3d(62vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(48vw, -124vh, 0);
    transform: translate3d(48vw, -124vh, 0);
  }
  }
  .circle-container:nth-child(190) .circle {
  -webkit-animation-delay: 924ms;
  animation-delay: 924ms;
  }
  .circle-container:nth-child(191) {
  width: 4px;
  height: 4px;
  -webkit-animation-name: move-frames-191;
  animation-name: move-frames-191;
  -webkit-animation-duration: 10558ms;
  animation-duration: 10558ms;
  -webkit-animation-delay: 7673ms;
  animation-delay: 7673ms;
  }
  @-webkit-keyframes move-frames-191 {
  from {
  -webkit-transform: translate3d(40vw, 103vh, 0);
    transform: translate3d(40vw, 103vh, 0);
  }
  to {
  -webkit-transform: translate3d(20vw, -115vh, 0);
    transform: translate3d(20vw, -115vh, 0);
  }
  }
  @keyframes move-frames-191 {
  from {
  -webkit-transform: translate3d(40vw, 103vh, 0);
    transform: translate3d(40vw, 103vh, 0);
  }
  to {
  -webkit-transform: translate3d(20vw, -115vh, 0);
    transform: translate3d(20vw, -115vh, 0);
  }
  }
  .circle-container:nth-child(191) .circle {
  -webkit-animation-delay: 1128ms;
  animation-delay: 1128ms;
  }
  .circle-container:nth-child(192) {
  width: 6px;
  height: 6px;
  -webkit-animation-name: move-frames-192;
  animation-name: move-frames-192;
  -webkit-animation-duration: 8417ms;
  animation-duration: 8417ms;
  -webkit-animation-delay: 5306ms;
  animation-delay: 5306ms;
  }
  @-webkit-keyframes move-frames-192 {
  from {
  -webkit-transform: translate3d(81vw, 107vh, 0);
    transform: translate3d(81vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(37vw, -135vh, 0);
    transform: translate3d(37vw, -135vh, 0);
  }
  }
  @keyframes move-frames-192 {
  from {
  -webkit-transform: translate3d(81vw, 107vh, 0);
    transform: translate3d(81vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(37vw, -135vh, 0);
    transform: translate3d(37vw, -135vh, 0);
  }
  }
  .circle-container:nth-child(192) .circle {
  -webkit-animation-delay: 1992ms;
  animation-delay: 1992ms;
  }
  .circle-container:nth-child(193) {
  width: 3px;
  height: 3px;
  -webkit-animation-name: move-frames-193;
  animation-name: move-frames-193;
  -webkit-animation-duration: 7324ms;
  animation-duration: 7324ms;
  -webkit-animation-delay: 10694ms;
  animation-delay: 10694ms;
  }
  @-webkit-keyframes move-frames-193 {
  from {
  -webkit-transform: translate3d(49vw, 108vh, 0);
    transform: translate3d(49vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(45vw, -127vh, 0);
    transform: translate3d(45vw, -127vh, 0);
  }
  }
  @keyframes move-frames-193 {
  from {
  -webkit-transform: translate3d(49vw, 108vh, 0);
    transform: translate3d(49vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(45vw, -127vh, 0);
    transform: translate3d(45vw, -127vh, 0);
  }
  }
  .circle-container:nth-child(193) .circle {
  -webkit-animation-delay: 2593ms;
  animation-delay: 2593ms;
  }
  .circle-container:nth-child(194) {
  width: 6px;
  height: 6px;
  -webkit-animation-name: move-frames-194;
  animation-name: move-frames-194;
  -webkit-animation-duration: 9691ms;
  animation-duration: 9691ms;
  -webkit-animation-delay: 3282ms;
  animation-delay: 3282ms;
  }
  @-webkit-keyframes move-frames-194 {
  from {
  -webkit-transform: translate3d(7vw, 104vh, 0);
    transform: translate3d(7vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(84vw, -117vh, 0);
    transform: translate3d(84vw, -117vh, 0);
  }
  }
  @keyframes move-frames-194 {
  from {
  -webkit-transform: translate3d(7vw, 104vh, 0);
    transform: translate3d(7vw, 104vh, 0);
  }
  to {
  -webkit-transform: translate3d(84vw, -117vh, 0);
    transform: translate3d(84vw, -117vh, 0);
  }
  }
  .circle-container:nth-child(194) .circle {
  -webkit-animation-delay: 3266ms;
  animation-delay: 3266ms;
  }
  .circle-container:nth-child(195) {
  width: 2px;
  height: 2px;
  -webkit-animation-name: move-frames-195;
  animation-name: move-frames-195;
  -webkit-animation-duration: 7167ms;
  animation-duration: 7167ms;
  -webkit-animation-delay: 5525ms;
  animation-delay: 5525ms;
  }
  @-webkit-keyframes move-frames-195 {
  from {
  -webkit-transform: translate3d(92vw, 108vh, 0);
    transform: translate3d(92vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(56vw, -121vh, 0);
    transform: translate3d(56vw, -121vh, 0);
  }
  }
  @keyframes move-frames-195 {
  from {
  -webkit-transform: translate3d(92vw, 108vh, 0);
    transform: translate3d(92vw, 108vh, 0);
  }
  to {
  -webkit-transform: translate3d(56vw, -121vh, 0);
    transform: translate3d(56vw, -121vh, 0);
  }
  }
  .circle-container:nth-child(195) .circle {
  -webkit-animation-delay: 3998ms;
  animation-delay: 3998ms;
  }
  .circle-container:nth-child(196) {
  width: 6px;
  height: 6px;
  -webkit-animation-name: move-frames-196;
  animation-name: move-frames-196;
  -webkit-animation-duration: 10998ms;
  animation-duration: 10998ms;
  -webkit-animation-delay: 7318ms;
  animation-delay: 7318ms;
  }
  @-webkit-keyframes move-frames-196 {
  from {
  -webkit-transform: translate3d(25vw, 102vh, 0);
    transform: translate3d(25vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(81vw, -108vh, 0);
    transform: translate3d(81vw, -108vh, 0);
  }
  }
  @keyframes move-frames-196 {
  from {
  -webkit-transform: translate3d(25vw, 102vh, 0);
    transform: translate3d(25vw, 102vh, 0);
  }
  to {
  -webkit-transform: translate3d(81vw, -108vh, 0);
    transform: translate3d(81vw, -108vh, 0);
  }
  }
  .circle-container:nth-child(196) .circle {
  -webkit-animation-delay: 689ms;
  animation-delay: 689ms;
  }
  .circle-container:nth-child(197) {
  width: 2px;
  height: 2px;
  -webkit-animation-name: move-frames-197;
  animation-name: move-frames-197;
  -webkit-animation-duration: 9896ms;
  animation-duration: 9896ms;
  -webkit-animation-delay: 4624ms;
  animation-delay: 4624ms;
  }
  @-webkit-keyframes move-frames-197 {
  from {
  -webkit-transform: translate3d(23vw, 107vh, 0);
    transform: translate3d(23vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(94vw, -118vh, 0);
    transform: translate3d(94vw, -118vh, 0);
  }
  }
  @keyframes move-frames-197 {
  from {
  -webkit-transform: translate3d(23vw, 107vh, 0);
    transform: translate3d(23vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(94vw, -118vh, 0);
    transform: translate3d(94vw, -118vh, 0);
  }
  }
  .circle-container:nth-child(197) .circle {
  -webkit-animation-delay: 2005ms;
  animation-delay: 2005ms;
  }
  .circle-container:nth-child(198) {
  width: 9px;
  height: 9px;
  -webkit-animation-name: move-frames-198;
  animation-name: move-frames-198;
  -webkit-animation-duration: 8483ms;
  animation-duration: 8483ms;
  -webkit-animation-delay: 859ms;
  animation-delay: 859ms;
  }
  @-webkit-keyframes move-frames-198 {
  from {
  -webkit-transform: translate3d(34vw, 107vh, 0);
    transform: translate3d(34vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(78vw, -128vh, 0);
    transform: translate3d(78vw, -128vh, 0);
  }
  }
  @keyframes move-frames-198 {
  from {
  -webkit-transform: translate3d(34vw, 107vh, 0);
    transform: translate3d(34vw, 107vh, 0);
  }
  to {
  -webkit-transform: translate3d(78vw, -128vh, 0);
    transform: translate3d(78vw, -128vh, 0);
  }
  }
  .circle-container:nth-child(198) .circle {
  -webkit-animation-delay: 3332ms;
  animation-delay: 3332ms;
  }
  .circle-container:nth-child(199) {
  width: 2px;
  height: 2px;
  -webkit-animation-name: move-frames-199;
  animation-name: move-frames-199;
  -webkit-animation-duration: 7072ms;
  animation-duration: 7072ms;
  -webkit-animation-delay: 10235ms;
  animation-delay: 10235ms;
  }
  @-webkit-keyframes move-frames-199 {
  from {
  -webkit-transform: translate3d(79vw, 106vh, 0);
    transform: translate3d(79vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(9vw, -117vh, 0);
    transform: translate3d(9vw, -117vh, 0);
  }
  }
  @keyframes move-frames-199 {
  from {
  -webkit-transform: translate3d(79vw, 106vh, 0);
    transform: translate3d(79vw, 106vh, 0);
  }
  to {
  -webkit-transform: translate3d(9vw, -117vh, 0);
    transform: translate3d(9vw, -117vh, 0);
  }
  }
  .circle-container:nth-child(199) .circle {
  -webkit-animation-delay: 2626ms;
  animation-delay: 2626ms;
  }
  .circle-container:nth-child(200) {
  width: 4px;
  height: 4px;
  -webkit-animation-name: move-frames-200;
  animation-name: move-frames-200;
  -webkit-animation-duration: 10965ms;
  animation-duration: 10965ms;
  -webkit-animation-delay: 6645ms;
  animation-delay: 6645ms;
  }
  @-webkit-keyframes move-frames-200 {
  from {
  -webkit-transform: translate3d(53vw, 109vh, 0);
    transform: translate3d(53vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(24vw, -115vh, 0);
    transform: translate3d(24vw, -115vh, 0);
  }
  }
  @keyframes move-frames-200 {
  from {
  -webkit-transform: translate3d(53vw, 109vh, 0);
    transform: translate3d(53vw, 109vh, 0);
  }
  to {
  -webkit-transform: translate3d(24vw, -115vh, 0);
    transform: translate3d(24vw, -115vh, 0);
  }
  }
  .circle-container:nth-child(200) .circle {
  -webkit-animation-delay: 2269ms;
  animation-delay: 2269ms;
  }
  `
  
  
    //创建背景效果
    let oFragmeng = document.createDocumentFragment()
    let style = document.createElement('style')
    style.innerHTML = styleValue
    oFragmeng.appendChild(style)
  
    for (var i = 0; i < 200; i++) {
      let cc = document.createElement("div");
      cc.className = 'circle-container'
      let c = document.createElement('div')
      c.className = 'circle'
      cc.appendChild(c);
      oFragmeng.appendChild(cc);
    }
    const container = document.createElement('div')
    container.id = 'bg'
    container.className = 'off'
    container.appendChild(oFragmeng)
    return container
  }

}
customElements.define("air-filter", AirFilterCard);

export class AirFilterCardEditor extends LitElement {

  setConfig(config) {
    this.config = deepClone(config);
  }

  static get properties() {
    return {
      hass: {},
      config: {}
    };
  }

  render() {
    var patt = new RegExp("^fan")
    if (!this.hass) {
      return html`dddddd
      `;
    }
    return html`
    <div class="card-config">
      <paper-input
        label="${this.hass.localize("ui.panel.lovelace.editor.card.generic.title")} (${this.hass.localize("ui.panel.lovelace.editor.card.config.optional")})"
        .value="${this.config.title}"
        .configValue="${"title"}"
        @value-changed="${this._valueChanged}"
      ></paper-input>
      <paper-input
        label="${this.hass.localize("ui.panel.lovelace.editor.card.generic.aspect_ratio")} (${this.hass.localize("ui.panel.lovelace.editor.card.config.optional")})"
        .value="${this.config.aspect_ratio}"
        .configValue="${"aspect_ratio"}"
        @value-changed="${this._valueChanged}"
      ></paper-input>
      <paper-input-container >
        <ha-icon icon="mdi:air-filter" slot="prefix"></ha-icon>
        <input type="text" value="${this.config.entity}" slot="input" list="browsers" .configValue="${"entity"}" autocapitalize="none" @change="${this._valueChanged}">
        <datalist id="browsers">
              ${Object.keys(this.hass.states).filter(a => patt.test(a) ).map(entId => html`
                  <option value=${entId}>${this.hass.states[entId].attributes.friendly_name || entId}</option>
                `)}
        </datalist>
      </paper-input-container>
      <h3>${this.hass.localize("ui.card.climate.operation")}</h3>

      <div class="side-by-side">
        <paper-input-container >
          <ha-icon icon="${this._geticon(this.config.modes[0])}" slot="prefix"></ha-icon>
          <input type="text" value="${this.config.modes[0]}" slot="input" list="modes" .configValue="${0}" autocapitalize="none" @change="${this._modeChanged}">
        </paper-input-container> 
        <paper-input-container > 
          <ha-icon icon="${this._geticon(this.config.modes[1])}" slot="prefix"></ha-icon>
          <input type="text" value="${this.config.modes[1]}" slot="input" list="modes" .configValue="${1}" autocapitalize="none" @change="${this._modeChanged}">
        </paper-input-container>
        <paper-input-container >
          <ha-icon icon="${this._geticon(this.config.modes[2])}" slot="prefix"></ha-icon>
          <input type="text" value="${this.config.modes[2]}" slot="input" list="modes" .configValue="${2}" autocapitalize="none" @change="${this._modeChanged}">
        </paper-input-container>
      </div>
      <datalist id="modes">
        <option value="Auto"></option>
        <option value="Silent"></option>
        <option value="Favorite"></option>
        <option value="Medium"></option>
        <option value="High"></option>
        <option value="Strong"></option>
        <option value="low"></option>
        <option value="humidity"></option>
        <option value="interval"></option>
      </datalist>
    </div>

    `;
  }
  static get styles() {
    return css `
    a{
      color: var(--accent-color);
    }
    .side-by-side {
      display: flex;
    }
    .side-by-side > * {
      flex: 1;
      padding-right: 4px;
    }
    .entities > * {
      width: 100%;
      padding-right: 4px;

    }
    paper-dropdown-menu{
      width: 100%;
      padding-right: 4px;
    }
    paper-input-container ha-icon{
      margin-right: 10px;
    }
    `
  }
  _geticon(i){
    const icons = {
      auto: "mdi:brightness-auto",
      silent: "mdi:weather-night",
      favorite: "mdi:cards-heart",
      strong: "mdi:weather-windy",
      medium: "mdi:chili-medium",
      high: "mdi:chili-hot",
      low: "mdi:chili-mild",
      humidity: "mdi:air-humidifier",
      interval: "mdi:av-timer"
    }
    return icons[i.toLowerCase()];
  }
  _modeChanged(ev){
    if (!this.config || !this.hass) {
      return;
    }
    const target = ev.target;
    this.config.modes[target.configValue] = target.value;
    this.configChanged(this.config)
  }
  _valueChanged(ev) {
    if (!this.config || !this.hass) {
      return;
    }
    const target = ev.target;
    if (this.config[`${target.configValue}`] === (target.value||target.__checked)) {
      return;
    }
    if (target.configValue) {
      if (target.value === "") {
        delete this.config[target.configValue];
      } else {
        this.config = {
          ...this.config,
          [target.configValue]: target.value||target.__checked
        };
      }
    }
    this.configChanged(this.config)
    // fireEvent(this, "config-changed", { config: this.config });
  }

  configChanged(newConfig) {
    const event = new Event("config-changed", {
      bubbles: true,
      composed: true
    });
    event.detail = {config: newConfig};
    this.dispatchEvent(event);
  }
}
customElements.define("air-filter-editor", AirFilterCardEditor);

function deepClone(value) {
  if (!(!!value && typeof value == 'object')) {
    return value;
  }
  if (Object.prototype.toString.call(value) == '[object Date]') {
    return new Date(value.getTime());
  }
  if (Array.isArray(value)) {
    return value.map(deepClone);
  }
  var result = {};
  Object.keys(value).forEach(
    function(key) { result[key] = deepClone(value[key]); });
  return result;
}


window.customCards = window.customCards || [];
window.customCards.push({
  type: "air-filter",
  name: "Air purifier",
  preview: true, // Optional - defaults to false
  description: "A air purifier card" // Optional
});
