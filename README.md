<!--
 * @Author        : fineemb
 * @Github        : https://github.com/fineemb
 * @Description   : 
 * @Date          : 2019-10-14 20:48:50
 * @LastEditors   : fineemb
 * @LastEditTime  : 2020-07-20 19:23:24
 -->
# Lovelace Xiaomi Air Filter Card

[![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg)](https://github.com/hacs/integration)

This is a card for Lovelace's Xiaomi Air Purifier that supports most devices.
Currently only tested on Xiaomi devices, if other devices have problems, please welcome Issues

I need to know the following information:
Services needed `fan.set_speed`, Need to provide the speed value
![01](https://user-images.githubusercontent.com/16739914/80853645-ea13b600-8c64-11ea-9eb6-3fb4a98f14b2.png)


## Update
v1.1.3
+ fix #8

## Preview
![](https://iobroker-1255708240.cos.ap-hongkong.myqcloud.com/original/2X/e/e6d8ba7a47ce87146f90f697d5fa31d426399e73.gif)

## HACS Installation 
Search for air filter
## Manual Installation
1. Download `air-filter-card.js`
1. Copy to `www\community\lovelace-air-filter-card`
1. Add the following to your Lovelace resources
    ``` yaml
    resources:
      - url: /community_plugin/lovelace-air-filter/air-filter-card.js
        type: module
    ```
1. Add the following to your Lovelace config views.cards key
    ```yaml
      type: 'custom:air-filter'
      modes:
        - auto
        - silent
        - Strong
      entity: fan.kong_qi_jing_hua_qi
      title: air_filter
      aspect_ratio: '.6'
    ```

## Options

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| type | string | **Required** | custom:air-filter
| entity | entity id | **Required** | The entity id of climate
| modes | array | **Required** | Operating mode, currently includes `auto,silent,favorite,strong,medium,high,low,humidity,interval`
| title | string | optional | Card title entity. Example:`fan.kong_qi_jing_hua_qi`
| aspect_ratio | Number | optional | Aspect ratio, Ratio of height to width
