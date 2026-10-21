---
title: "Gate 14"
niche: "Visa centre"
city: "Saint Petersburg"
summary: "A visa centre styled as an airport: an LED departures board with prices and processing times, a dot-matrix globe with routes from Pulkovo, a passport you leaf through with stamps, and application status by number."
tagline: "We gather the visa papers. All you do is buy the ticket."
term: "Two days, concept"
---

## Task

A visa centre in Saint Petersburg, by Ploshchad Vosstaniya. Collecting visa documents is stressful and dull, so the site has to calm people down straight away: show where the centre can get you a visa, what it costs and how long it takes, and let people apply or check their status without calling.

## Solution

The site is built on an airport metaphor. The first screen is an LED departures board: a dot-matrix font, yellow lights, and rows with country, visa type, processing time, price and booking status. Next to it are live widgets with the euro rate and local time. Right below it is a globe made of the same dots: you can spin the Earth, and tapping a country draws a dotted route from Pulkovo and shows a boarding pass with time and price. The globe is plain WebGL with no 3D library and falls back to a flat map without a GPU. Each of the ten countries has its own page with documents and prices. The passport turns by swipe or arrows, its pages bend like paper, and inside are Italian, Chinese and Japanese visas with stamps. First-time visitors see a short intro: a boarding pass, a stamp and a torn stub. Animation is built with GSAP, there are nineteen pages, and prices and times live in one place, so they change without touching the layout.
