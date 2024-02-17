---
title = "The unit circle"
authors = [ "kyo" ]
tags = [ "interactive" ]
---

The unit circle is a circle with radius $$1$$. Geometric interpretations of the
six trigonometric functions follow from various right triangles with one side
along the radius of the unit circle.

## Sine and cosine

Consider the following right triangle with hypotenuse of length $$1$$ and sides
parallel to the $$x$$- and $$y$$-axes:

::teximg{src="$assets-compiled/unit-circle/sincos.tex" alt="A right triangle within a unit circle. The angle closest to the origin is labeled theta. The hypotenuse is of length 1, the bottom side is of length cos theta, and the right side is of length sin theta."}

Taking the angle $$\theta$$ as pictured, we can convince ourselves that the
length of the side parallel to the $$x$$-axis is $$\cos\theta$$ using the
definition of the cosine function:

$$
\cos\theta = \frac{\text{adjacent}}{\text{hypotenuse}}
$$

Since the length of the hypotenuse is $$1$$, we have:

$$
\cos\theta = \frac{\text{adjacent}}{1} = \text{adjacent}
$$

Similarly, we can show that the side parallel to the $$y$$-axis has length
$$\sin\theta$$:

$$
\sin\theta = \frac{\text{opposite}}{\text{hypotenuse}} =
  \frac{\text{opposite}}{1} = \text{opposite}
$$

And by the Pythagorean theorem, we find that

$$
\begin{align*}
  a^2 + b^2 &= c^2 \\
  \sin^2 \theta + \cos^2 \theta &= 1^2 \\
  \sin^2 \theta + \cos^2 \theta &= 1
\end{align*}
$$

:::comment{.iris.thinking}
This rather remarkable identity, called the Pythagorean identity, is arguably
the most important concept in trigonometry. Remember it!
:::

## Tangent and secant

Consider a new triangle which is similar to the previous one (i.e. having all
the same angles), but this time with the bottom side having length $$1$$:

::teximg{src="$assets-compiled/unit-circle/tansec.tex" alt="A right triangle similar to the previous one. All angles are the same, but this time the bottom side is of length 1, the hypotenuse is of length sec theta, and the right side is of length tan theta."}

Because the previous triangle and this new one (let's call them triangles $$1$$
and $$2$$ respectively) are similar, we know the following:

$$
\frac{\text{opposite}_1}{\text{adjacent}_1} =
  \frac{\text{opposite}_2}{\text{adjacent}_2}
$$

In other words, the proportions of the side lengths within the triangles (i.e.
the values of the trigonometric functions) are the same.

Using this, we can show that the side of the triangle opposite to $$\theta$$
indeed has length $$\tan\theta$$:

$$
\begin{align*}
  \frac{\text{opposite}_1}{\text{adjacent}_1} &=
    \frac{\text{opposite}_2}{\text{adjacent}_2} \\
  \frac{\sin\theta}{\cos\theta} &= \frac{\text{opposite}_2}{1} \\
  \tan\theta &= \text{opposite}_2
\end{align*}
$$

And using the Pythagorean theorem, we can find the length of the hypotenuse:

$$
\begin{align*}
  a^2 + b^2 &= c^2 \\
  1^2 + \tan^2 \theta &= c^2 \\
  \sqrt{1 + \tan^2 \theta} &= c
\end{align*}
$$

But this is not $$\sec\theta$$! What gives? Let's use the Pythagorean identity
we found before:

$$
\sin^2 \theta + \cos^2 \theta = 1
$$

And divide both sides by $$\cos^2 \theta$$:

$$
\begin{align*}
  \frac{\sin^2 \theta}{\cos^2 \theta} + \frac{\cos^2 \theta}{\cos^2 \theta} &=
    \frac{1}{\cos^2 \theta} \\
  \tan^2 \theta + 1 &= \sec^2 \theta
\end{align*}
$$

Now we can finally see that the hypotenuse has length $$\sec\theta$$:

$$
\begin{align*}
  c &= \sqrt{1 + \tan^2 \theta} \\
    &= \sqrt{\sec^2 \theta} \\
    &= \sec\theta
\end{align*}
$$

## Cotangent and cosecant

This new triangle is somewhat more confusing: take the first one and invert it
so the two triangles combined form a rectangle with side lengths $$\sin\theta$$
and $$\cos\theta$$, then extend the side on the left so it has length $$1$$.
This resulting triangle will also be similar to the original one:

::teximg{src="$assets-compiled/unit-circle/cotcsc.tex" alt="A right triangle similar to the first one. All angles are the same, but the triangle is flipped over such that what was once the right side is now on y-axis. This left side has length 1, the top side has length cot theta, and the hypotenuse has length csc theta."}

As before, we'll call the original and new triangles $$1$$ and $$2$$
respectively, and once again we have

$$
\frac{\text{opposite}_1}{\text{adjacent}_1} =
  \frac{\text{opposite}_2}{\text{adjacent}_2}
$$

And using the side lengths we know, we can show that the top side of this
triangle has length $$\cot\theta$$:

$$
\begin{align*}
  \frac{\text{opposite}_1}{\text{adjacent}_1} &=
    \frac{\text{opposite}_2}{\text{adjacent}_2} \\
  \frac{\sin\theta}{\cos\theta} &= \frac{1}{\text{adjacent}_2} \\
  \frac{\cos\theta}{\sin\theta} &= \text{adjacent}_2 \\
  \cot\theta &= \text{adjacent}_2
\end{align*}
$$

Once again, we use the Pythagorean theorem to find the length of the hypotenuse:

$$
\begin{align*}
  a^2 + b^2 &= c^2 \\
  1^2 + \cot^2 \theta &= c^2 \\
  \sqrt{1 + \cot^2 \theta} &= c
\end{align*}
$$

And we find a more convenient value for $$1 + \cot^2 \theta$$ by again using the
Pythagorean identity, but this time dividing by $$\sin^2 \theta$$:

$$
\begin{align*}
  \sin^2 \theta + \cos^2 \theta &= 1 \\
  \frac{\sin^2 \theta}{\sin^2 \theta} + \frac{\cos^2 \theta}{\sin^2 \theta} &=
    \frac{1}{\sin^2 \theta} \\
  1 + \cot^2 \theta &= \csc^2 \theta
\end{align*}
$$

Using this, we have:

$$
\begin{align*}
  c &= \sqrt{1 + \cot^2 \theta} \\
    &= \sqrt{\csc^2 \theta} \\
    &= \csc \theta
\end{align*}
$$

## Points on the unit circle

Due to the geometric meaning of $$\sin\theta$$ and $$\cos\theta$$ shown [above](#sine-and-cosine),
any point on the unit circle is given by $$(\cos\theta, \sin\theta)$$ where
$$\theta$$ is the angle between the $$x$$-axis and line from the origin to the
point (the same $$\theta$$ as the triangles above).

Here are some of the common points which it may be helpful to memorize. These
values are derived from the special right triangles ($$45$$--$$45$$--$$90$$ and
$$30$$--$$60$$--$$90$$).

::teximg{src="$assets-compiled/unit-circle/points.tex" alt="The points on the unit circle in the first quadrant. 0 degrees or 0 radians: (1, 0), 30 degrees or pi/6 radians: (sqrt(3)/2, 1/2), 45 degrees or pi/4 radians: (sqrt(2)/2, sqrt(2)/2), 60 degrees or pi/3 radians: (1/2, sqrt(3)/2), 90 degrees or pi/2 radians: (0, 1)"}

The points in the other three quadrants can be found by changing signs as
appropriate.

## Interactive

Explore the unit circle in this interactive:

::iframe{src="$assets/unit-circle-interactive.html" width="600" height="480"}
