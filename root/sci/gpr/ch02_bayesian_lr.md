---
title: Gaussian Process Regression
date: 14-04-2026
author: quartermaster
author_link: https://x.com/HQuarterMa43504/
---

# Bayes to Linear Regression

Before we go around trying our hand at GPR, we'll need to get into the Bayesian mindset. Since the goal of a GPR is to approximate a function mapping, how about we try our hand at something simpler, that is, linear regression. A function mapping that maps a line to a set of data.

Every one understands what a linear regression is (hopefully by now). Given a set of points $(x_{i}, y_{i})$, a linear regression simply says that the relationship between $x$ and $y$ is linear, i.e.,:

$$ y = mx + c $$

The coefficients $m$ and $c$ are the slope and intercept respectively, determined by minimizing the least squares error:

$$ \text{LSE} = \sum_{i}^{N}{(y_{i} - (mx_{i} + c))^{2}} $$

We can differentiate this expression with respect to $m$ and $c$, and set the derivatives to zero, giving us two equations and solve them to get $m$ and $c$ values for a given dataset.

Can we reformulate this "frequentist" linear regression problem into a Bayesian problem?

As it turns out, we can!

First, we can view a linear regression as a model where each point $y_{i}$ is a normal distribution around the point $m x_{i} + c$. What this means is,

$$ y_{i} = N(m x_{i} + c | \sigma^2) $$
