---
title = "Vector"
authors = [ "kyo" ]
cite = [
    "labutin_math_4a_f23",
    "landry_math_6a_w24",
]
---

In [$$\mathbb{R}^n$$]($r/real-numbers), a vector is an ordered list of $$n$$
real numbers which behaves like an $$n \times 1$$ [matrix]($m/matrix).

In general, a vector is any member of a [vector space]($v/vector-space).

## Notation

A variable representing a vector may be denoted

- $$\vect{v}$$
- $$\vec{v}$$
- $$\overrightarrow{AB}$$ (where $$A$$ and $$B$$ are the [points]($p/point)
  representing the tail and tip of the vector)

The value of a vector in $$\mathbb{R}^n$$ may be denoted

- $$\langle x_1, \ldots, x_n \rangle$$ (an ordered list of numbers surrounded by
  angle brackets)
- $$\begin{bmatrix} x_1 \\ \vdots \\ x_n \end{bmatrix}$$ (as a column matrix)
- $$x\uveci + y\uvecj + z\uveck$$ (in terms of the [standard basis vectors]($s/standard-basis))
- The zero vector $$\langle 0, 0, 0, \ldots, 0 \rangle$$ is denoted
  $$\vect{0}$$.

## Interpretation

In $$\mathbb{R}^2$$ and $$\mathbb{R}^3$$, vectors can be seen as arrows from
the origin or as an offset between two points in space.

A vector which represents a position in space is called a [position vector]($p/position-vector).

## Between two points

The vector from the point $$A = (a_1, \ldots, a_n)$$ to
$$B = (b_1, \ldots, b_n)$$ is given by

$$
  \overrightarrow{AB}=\langle b_1 - a_1, \ldots, b_n - a_n \rangle
$$
