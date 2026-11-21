package com.example.roomscan.geometry

import kotlin.math.*

data class Vec2(val x: Double, val y: Double) {
    fun distanceTo(other: Vec2): Double = hypot(x - other.x, y - other.y)
}

data class LineSegment(val a: Vec2, val b: Vec2) {
    fun length(): Double = a.distanceTo(b)
    fun direction(): Vec2 {
        val dx = b.x - a.x
        val dy = b.y - a.y
        val len = sqrt(dx * dx + dy * dy)
        return if (len == 0.0) Vec2(0.0, 0.0) else Vec2(dx / len, dy / len)
    }
}

data class Opening(
    val center: Vec2,
    val widthMeters: Double,
    val kind: Kind
) {
    enum class Kind { DOOR, WINDOW }
}

object MergeUtil {
    private const val ANGLE_SNAP_DEG = 10.0
    private const val MERGE_DIST = 0.05 // meters

    fun snapAngleRadians(theta: Double): Double {
        val degrees = Math.toDegrees(theta)
        val options = listOf(0.0, 90.0, 180.0, 270.0)
        val snapped = options.minBy { abs(it - ((degrees % 360 + 360) % 360)) }
        return Math.toRadians(snapped)
    }

    fun snapSegment(seg: LineSegment): LineSegment {
        val dx = seg.b.x - seg.a.x
        val dy = seg.b.y - seg.a.y
        val theta = atan2(dy, dx)
        val snapped = snapAngleRadians(theta)
        val len = hypot(dx, dy)
        val cx = (seg.a.x + seg.b.x) / 2.0
        val cy = (seg.a.y + seg.b.y) / 2.0
        val ux = cos(snapped)
        val uy = sin(snapped)
        val hx = ux * (len / 2.0)
        val hy = uy * (len / 2.0)
        return LineSegment(Vec2(cx - hx, cy - hy), Vec2(cx + hx, cy + hy))
    }

    fun mergeSegments(segments: MutableList<LineSegment>, newSeg: LineSegment) {
        // Merge with any segment that is colinear and close/overlapping
        var inserted = false
        val snappedNew = snapSegment(newSeg)
        val iterator = segments.listIterator()
        while (iterator.hasNext()) {
            val s = iterator.next()
            val snappedOld = snapSegment(s)
            if (areColinear(snappedNew, snappedOld) && areNear(snappedNew, snappedOld)) {
                // merge endpoints along the line axis
                val pts = listOf(snappedNew.a, snappedNew.b, snappedOld.a, snappedOld.b)
                val axis = snappedNew.direction()
                val proj = pts.map { it.x * axis.x + it.y * axis.y }
                val minIdx = proj.indices.minBy { proj[it] }
                val maxIdx = proj.indices.maxBy { proj[it] }
                val merged = LineSegment(pts[minIdx], pts[maxIdx])
                iterator.set(merged)
                inserted = true
                break
            }
        }
        if (!inserted) segments.add(snappedNew)
    }

    private fun areColinear(a: LineSegment, b: LineSegment): Boolean {
        val da = a.direction()
        val db = b.direction()
        val dot = abs(da.x * db.x + da.y * db.y)
        return dot > cos(Math.toRadians(ANGLE_SNAP_DEG))
    }

    private fun areNear(a: LineSegment, b: LineSegment): Boolean {
        // If the shortest distance between lines is small and projections overlap
        val dist = min(
            min(pointToSegDistance(a.a, b), pointToSegDistance(a.b, b)),
            min(pointToSegDistance(b.a, a), pointToSegDistance(b.b, a))
        )
        if (dist > MERGE_DIST) return false

        val ax = a.b.x - a.a.x
        val ay = a.b.y - a.a.y
        val bx = b.b.x - b.a.x
        val by = b.b.y - b.a.y
        val aProj = listOf(0.0, ax * ax + ay * ay)
        val bProjA0 = (b.a.x - a.a.x) * ax + (b.a.y - a.a.y) * ay
        val bProjA1 = (b.b.x - a.a.x) * ax + (b.b.y - a.a.y) * ay
        val minB = min(bProjA0, bProjA1)
        val maxB = max(bProjA0, bProjA1)
        val minA = min(aProj[0], aProj[1])
        val maxA = max(aProj[0], aProj[1])
        return max(minA, minB) <= min(maxA, maxB)
    }

    private fun pointToSegDistance(p: Vec2, s: LineSegment): Double {
        val x = p.x; val y = p.y
        val x1 = s.a.x; val y1 = s.a.y
        val x2 = s.b.x; val y2 = s.b.y
        val A = x - x1; val B = y - y1
        val C = x2 - x1; val D = y2 - y1
        val dot = A * C + B * D
        val lenSq = C * C + D * D
        val t = if (lenSq != 0.0) max(0.0, min(1.0, dot / lenSq)) else 0.0
        val xx = x1 + t * C
        val yy = y1 + t * D
        return hypot(x - xx, y - yy)
    }
}
