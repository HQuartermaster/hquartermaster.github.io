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

## Recap: Bayes Rule

*This is a necessary concept before we start with what a GPR is*.

Suppose:

- There is a medical test for a rare disease that if tested positive, has an accuracy of 95%. Meaning, the test was given to 100 people who had the disease, and it showed "positive" for 95 people. The test was then given 100 people who did not have the disease and it showed "negative" for 95 people.

- The disease itself occurs at the rate of 1% in the general population.

If a person from the general population tests positive, what is the probability that he has the disease?

We get a little bit mathy and use the following expressions:

| Expression | Description |
| ---        | ---         |
| $ P(+) $ | Probability that someone tests positive. |
| $P(+ | D)$ | Probability that test gives positive given someone has the disease. |
| $P(D)$     | Probability of the disease occurring in the general population. |
| $ P(D | +) $ | Probability that someone has the disease given they have tested positive. |

We are trying to find:

$$P(D | +)$$

The way I find intuitive to solve this problem is by construction of a probability "flow chart" something I'd picked up from my JEE professor:

![Bayes Chart](ml/gpr/bayes_chart.png)

This chart should be self-explanatory if you've been reading. Now, we have to remember: the test result has already come back positive that means: we disregard all the branches where the tests are negative.

![Bayes Chart Relevant](ml/gpr/bayes_chart_relevant_branch.png)

Now from this chart, we have to find out the probability that the right branch occurs.

Intuitively, it should just be the probability of the right branch, divided by the total probability of the two branches. That is,

$$ \frac{0.01 \cdot 0.95}{0.01 \cdot 0.95 + 0.99 \cdot 0.05} = 0.161$$

There we have the answer: the probability someone has a disease if they tested positive on this test is 16.1%. The test is poor! What this tells us is, if the disease is rare, the test has to be extremely accurate. 

But anyways, let's think about what we just did here. 

The denominator i.e., $0.01 \cdot 0.95 + 0.99 \cdot 0.05$ is just the probability of testing positive on the test regardless of whether you have the disease or not.

The numerator $0.01 \cdot 0.95$ is a product of two quantities: one, the probability of having the disease $P(D)$ and the probability of testing positive if you have the disease: $P(+|D)$.

And the expression gives us: the probability of having the disease if you test positive $P(D|+)$.

Combining all the above, we can write the same expression in notation form:

$$ P(D|+) = \frac{P(+|D)P(D)}{P(+)} $$

This is **Bayes Rule**.

In Bayesian language, we call $P(D)$ the "prior". This is our knowledge before we did the test, that it occurs 1% in the general population, so our patient must have a 1% chance of having the disease.

$P(D|+)$ is called the "posterior". Now that we did the test, and got positive, the probability of him having the disease jumps from 1% to 16.1%. Still not enough for a diagnosis which is why multiple tests of different underlying methods are done to confirm a disease.

## Bayes to Linear Regression

Before we go around trying our hand at GPR, we'll need to get into the Bayesian mindset. Since the goal of a GPR is to approximate a function mapping, how about we try our hand at something simpler, that is, linear regression.

Every one understands what a linear regression is (hopefully by now). Given a set of points $(x_{i}, y_{i})$, a linear regression simply says that the relationship between $x$ and $y$ is linear, i.e.,:

$$ y = mx + c $$

The coefficients $m$ and $c$ are the slope and intercept respectively, determined by minimizing the least squares error:

$$ \text{LSE} = \sum_{i}^{N}{(y_{i} - (mx_{i} + c))^{2}} $$

We can differentiate this expression with respect to $m$ and $c$, and set the derivatives to zero, giving us two equations and solve them to get $m$ and $c$ values for a given dataset.

But this is boring, say the Bayesians. How about...the slope and intercepts be random variables with a Gaussian distribution? 

$$ 
\begin{aligned}
m \sim N(\mu_{m}, \sigma_{m}^{2}) \\
c \sim N(\mu_{c}, \sigma_{c}^{2}) 
\end{aligned}
$$