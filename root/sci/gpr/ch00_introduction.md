---
title: Gaussian Process Regression
date: 14-04-2026
author: quartermaster
author_link: https://x.com/HQuarterMa43504/
---

# Gaussian Process Regression

The point of this article is to introduce you to something called Gaussian Process Regression (GPR). It's one of the oldest techniques that has seen a rebirth in the era of machine learning.

## Motivation

Let's get right into it. Suppose we have a mysterious function, 

$$ y = f(x) $$

We don't know what this function is. But we do have the ability to sample this function. By sampling, what I mean is: I can put an $x$, and get a $y$ out to get a $(x,y)$ pair. 

So you might wonder: We have the function already, I can put an $x$ and get a $y$, why do I need to learn the mapping? Well, you see, there's just one problem: **this function is costly to compute**.

Suppose you want to find the minima of this function (or a maxima), you'll use an optimization algorithm (like SD, BFGS or Newton's Method) and typically, this would require a lot of these function evaluations. 

Let's say we have 4 points: $(x_{1}, y_{1})$, $(x_{2}, y_{2})$, $(x_{3}, y_{3})$ and $(x_{4}, y_{4})$.

Using these four points, is it possible to create a "simulated" $f(x)$? One that is easy to compute? The answer is yes, of course, we have been doing this for ages. You could fit a 5 degree polynomial through these four points by finding the coefficients of $ax^5 + bx^4 + cx^3 + dx^2 + ex + f$. But not every function is a polynomial! There must be a better way to do this. This is where **Gaussian Process Regression** or GPR comes to our aid.

You might think that GPR being part of ML means it was pioneered sometime in the 1990s or 2000s, or even more recently, but actually, no! GPRs were pioneered back in the 1950s, by a researcher in South Africa (Danie G. Krige) to estimate where to place a gold mine in a particular region by just "sampling" (in this case digging a smaller mine) and finding the gold concentrations in each smaller mine sampled. 

If you think about it, this is the perfect situation that needs what GPRs were built to do: we have a function $y = f(x)$, here $x$ may be a 2D or a 3D vector ```(lattitude, longitude, height_sea_level)``` and $y$ is the concentration of gold. $f(x)$ is extremely costly to compute: you have to spend man hours digging the place, and you can't just dig as many points as you want lest you start causing environmental destruction. So you need to be able to tell roughly where the maxima of gold lies just from sampling a few points.

## The Toy Problem

Every ML exercise needs a toy problem. For this article, we will use the following 1D function as a toy problem:

$$ f(x) = sin(x) + 0.5cos(2x) + e^{-x^2} $$

Why this? Just because I felt like it. It's not easy to guess by accident. There's two trigonometric terms and an exponential one. Should be a decent stress test for our algorithm.