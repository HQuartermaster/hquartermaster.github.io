---
title: Fast Fourier Transform
date: 29-04-2026
author: quartermaster
author_link: https://x.com/HQuarterMa43504/
citations:
    fabrice:
        author: "Fabrice Bellard"
        year: 2026
        title: "Fabrice Bellard's Homepage"
        link: https://bellard.org/
    ctwiki:
        author: "Wikipedia Contributors"
        year: 2026
        title: "Cooley-Tukey Algorithm"
        link: https://en.wikipedia.org/wiki/Cooley%E2%80%93Tukey_FFT_algorithm
    pcm:
        author: "Wikipedia Contributors"
        year: 2026
        title: "Pulse-Code Modulation"
        link: https://en.wikipedia.org/wiki/Pulse-code_modulation
    waveform:
        author: "Wikipedia Contributors"
        year: 2026
        title: "Waveform"
        link: https://en.wikipedia.org/wiki/Waveform
    dac:
        author: "Wikipedia Contributors"
        year: 2026
        title: "Digital-to-Analog Converter"
        link: https://en.wikipedia.org/wiki/Digital-to-analog_converter
    diracdelta:
        author: "Wikipedia Contributors"
        year: 2026
        title: "Dirac-Delta"
        link: https://en.wikipedia.org/wiki/Dirac_delta_function
    heisenberg1925:
        author: "Werner Heisenberg"
        year: 1925
        title: "Quantum Theoretical Reinterpretation of Kinematic and Mechanical Relations"
        link: "https://wucj.lab.westlake.edu.cn/Others/Heisenberg_Quantum_Mechanics.pdf"
---

# The Fast Fourier Transform

For most of my teenagehood, the FFT was a strange mystery; the tool of wizards like Fabrice Bellard[@fabrice] and the experts over in the field of quantum chemistry using it to speed up their calculations. I knew the rough sketch of what it was, and what it did, but one glance at the Wikipedia page for the Cooley-Tukey Algorithm[@ctwiki], and I'd be falling asleep. This article is written to make the FFT and its practical implementation accessible to people who otherwise do not have the time to sit through the relevant papers and also as a reference for my future self! 

## The Fourier Transform

Suppose we have a function $f(t)$, the Fourier transform of this function is given by the following formula:

$$ \hat{f}(\omega) = \int_{-\infty}^{\infty}{e^{-2 \pi i \omega t} h(t) dt} $$

Here, we are taking a function of $t$, and turning it into a function of another quantity $f$ via the improper integral. $f(t)$ is called the "time-space representation" of the function, and $\hat{f}(\omega)$ is called the "frequency-space representation"; they are said to represent the same function but as functions of different variables.

## What does the Fourier transform do?

A Fourier transform tells us what "frequencies" a function is composed of. "Frequency" of what? Sine and cosine waves.

Any real-valued function can be represented as an infinite sum of sines and cosines: 

$$ f(t) = a_{0} + \sum_{n=1}^{\infty}{a_{n} \sin{nx} + b_{n} \cos{nx}} $$

The Fourier Transform turns this real valued function into a complex valued function $\hat{f}({\omega})$. 

The value of $\hat{f}({\omega})$ tells us: 

- **magnitude** i.e., $|\hat{f}({\omega})|$: The amplitude of frequency $\omega$ to the whole signal.
- **angle** i.e., $\arctan{\frac{Im(\hat{f}({\omega}))}{Re(\hat{f}({\omega}))}}$: The phase shift to be applied to the frequency $\omega$

Take the case of the sine wave with a frequency of 440 Hz:

$$ \sin{2\pi(440)t} $$

We plot the wave form and the Fourier transform:

![](sci/ft440hz.png)

You can see how the Fourier transform peaks at 440 Hz, this is what it is telling us: out of all the frequencies, the one at 440 Hz is the most prominent in this signal.

You might wonder why it doesn't just peak at 440 and have the rest of the frequencies be 0, after all, in our wave we ONLY have 440 Hz. The answer is: yes, it should. The actual Fourier transform would be a Dirac-Delta[@diracdelta] at 440. But this graph is generated using Numpy's FFT library and there we supply a "window" of data (the sine function does not stretch out to infinity on a computer) and we have a sampling frequency, leading to other frequencies also showing up as it is not a truly analytical periodic sine wave. 

This is what we call the time-frequency uncertainty principle. A signal cannot be localized in time and frequency simultaneously. If you have a "windowed" signal, you cannot have its true frequency representation. Apply this to quantum wavefunctions, and you get the famous Heisenberg uncertainty principle[@heisenberg1925]! In quantum mechanics, the momentum wavefunction is a Fourier transform of the position wavefunction, i.e.,

$$ \Psi({p}) = \frac{1}{\sqrt{2\pi\hbar}} \int_{-\infty}^{\infty}{\Psi(x)e^{-\frac{ipx}{\hbar}} dx} $$

How wonderful! But we're going ahead of ourselves.

If you want a more in depth explanation of the Fourier transform, this YouTube video by 3blue1brown is **the** best explanation I've encountered so far. In fact, I suggest you pause reading this article and go through this 17-minute video.

<iframe width="560" height="315" src="https://www.youtube.com/embed/spUNpyF58BY?si=7R4T-PNgSbkgbyuo" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## Audio as a Source of Data

In practice, $f$ is usually a signal, often periodic (but it does not have to be). Take the most common example: audio data. 

In a computer, the audio data looks like a string of numbers:

```
0
1254
2481
3653
4746
5736
6602
7325
4554
1248
146
-958
-2047
-3100
-4097
-5018
-5847
-2612
-1552
-462
```

This is what we call PCM (pulse-code modulation)[@pcm]. A sequence of 16-bit signed numbers. Each data point here represents the amplitude. Physically, the amplitude is the displacement of the diaphragm of your speaker. The DAC[@dac] converts each PCM input to an analog signal, which then (via an amplifier and other related circuitry) drives the diaphragm of the speaker to produce sound. The most common frequency used by speakers is 44,100 Hz. So each amplitude here is a value for $\frac{1}{44100}$ of a second. 

It really _is_ that simple. Sound is just a sequence of numbers. Sound is not an instant phenomenon. The richness of sound does not come from a single instant. Its richness comes from its structure through time. You may have noticed a "graph" your microphone recorder app makes when you record sound. Something like this:

![](sci/spectrogram.png)

This is what is called a wave form[@waveform]. It is just a plot of the PCM values against time. The reason why it looks so "crowded" is of course, we are sampling usually at the rate of 22,100 or 44,100 samples per second, so there are a *lot* of points per second.

Our hardware uses PCM data in time space as it is easy to map the movement of the diaphgram to. Yet the our ears and brains work in frequency space. You can "tell" from your ears the difference between a 440 Hz wave and a 100 Hz wave form. Suppose an annoying high pitch sound is part of your PCM data. How do you remove it? You take the Fourier transform of the PCM data, remove the high frequency values, and then do an inverse Fourier transform to get the new PCM data. This is what all audio filters fundamentally do!

## The Discrete Fourier Transform

This expression,

$$ \hat{f}(\omega) = \int_{-\infty}^{\infty}{e^{-2 \pi i \omega t} h(t) dt} $$

...works when $f(t)$ is an analytical function. However, in real life, $f(t)$ is usually a signal, that is being sampled at a finite rate. In reality, we don't really have $f(t)$ as a function. Instead we have $f(t_0), f(t_1), f(t_2) ... f(t_{n})$, i.e., the values of $f$ at discrete points in time. 

For this, we have the discrete variant of the Fourier transform aptly named the Discrete Fourier Transform.

### Derivation of the DFT

Suppose we are sampling the signal $f(t)$ at discrete intervals $T_{s}$, this "discretized" function can actually be represented as $f_{s}(t)$ using the Dirac-delta as follows:

$$ f_{s}(t) = f(t)\sum_{i=0}^{N}{\delta(t - i T_s)} $$

This is quite simple to understand. The Dirac-Delta returns 1 when 0 and 0 otherwise. When $t$ is a multiple of $T_{s}$, the summation only returns 1 (and thus the value of $f(t)$) if we are at a point where the signal is being sampled, otherwise all the $\delta(t - i T_s)$ in the sum are 0 and the function is 0.

Now, we apply Fourier transform to $f_{s}(t)$:

$$ \int_{-\infty}^{\infty}{e^{-i 2\pi \omega t}f(t)\sum_{i=0}^{N}{\delta(t - i T_s)}} dt $$

Taking the summation out,

$$ \sum_{i=0}^{N}{\int_{-\infty}^{\infty}{e^{-i 2\pi \omega t}f(t)\delta(t - i T_s)dt}} $$

The Dirac-Delta has an interesting property, called the **sifting property**:

$$ \int_{-\infty}^{\infty}{f(t)\delta(t - t_{0})} = f(t_{0}) $$

We use the above property to get:

$$ \sum_{i=0}^{N}{e^{-i 2\pi \omega n T_s}f(i T_s)} $$