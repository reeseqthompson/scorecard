package com.example.roomscan.geometry

import com.google.ar.core.Plane
import com.google.ar.core.Pose
import java.nio.FloatBuffer
import kotlin.math.abs

class FloorPlanBuilder {
    private val walls = mutableListOf<LineSegment>()
    private val doors = mutableListOf<Opening>()
    private val windows = mutableListOf<Opening>()

    fun updateWithPlane(plane: Plane) {
        if (plane.type != Plane.Type.VERTICAL || plane.polygon == null) return
        val polygon: FloatBuffer = plane.polygon
        val pose: Pose = plane.centerPose
        val pts = floatBufferToWorldXZ(polygon, pose)
        if (pts.size < 2) return
        for (i in pts.indices) {
            val a = pts[i]
            val b = pts[(i + 1) % pts.size]
            if (a.distanceTo(b) < 0.05) continue
            val seg = LineSegment(a, b)
            MergeUtil.mergeSegments(walls, seg)
        }
    }

    fun addOpening(kind: Opening.Kind, p: Vec2, defaultWidth: Double = 0.9) {
        val opening = Opening(p, defaultWidth, kind)
        when (kind) {
            Opening.Kind.DOOR -> doors.add(opening)
            Opening.Kind.WINDOW -> windows.add(opening)
        }
    }

    fun getWalls(): List<LineSegment> = walls
    fun getDoors(): List<Opening> = doors
    fun getWindows(): List<Opening> = windows

    fun reset() {
        walls.clear(); doors.clear(); windows.clear()
    }

    private fun floatBufferToWorldXZ(buffer: FloatBuffer, pose: Pose): List<Vec2> {
        buffer.rewind()
        val out = ArrayList<Vec2>(buffer.remaining() / 2)
        while (buffer.remaining() >= 2) {
            val x = buffer.get()
            val z = buffer.get()
            val world = pose.transformPoint(floatArrayOf(x, 0f, z))
            // ARCore world: x-right, y-up, z-back. For top-down, use (x, z)
            out.add(Vec2(world[0].toDouble(), world[2].toDouble()))
        }
        return simplify(out)
    }

    // Basic RDP simplification to reduce polygon noise
    private fun simplify(points: List<Vec2>, epsilon: Double = 0.01): List<Vec2> {
        if (points.size < 3) return points
        val result = ArrayList<Vec2>()
        rdp(points, 0, points.size - 1, epsilon, result)
        result.add(points.last())
        return result
    }

    private fun rdp(points: List<Vec2>, start: Int, end: Int, eps: Double, out: MutableList<Vec2>) {
        var maxDist = 0.0
        var index = start
        val a = points[start]
        val b = points[end]
        for (i in start + 1 until end) {
            val d = perpendicularDistance(points[i], a, b)
            if (d > maxDist) {
                maxDist = d
                index = i
            }
        }
        if (maxDist > eps) {
            rdp(points, start, index, eps, out)
            rdp(points, index, end, eps, out)
        } else {
            out.add(a)
        }
    }

    private fun perpendicularDistance(p: Vec2, a: Vec2, b: Vec2): Double {
        val dx = b.x - a.x
        val dy = b.y - a.y
        if (abs(dx) < 1e-9 && abs(dy) < 1e-9) return p.distanceTo(a)
        return kotlin.math.abs((dy * p.x - dx * p.y + b.x * a.y - b.y * a.x)) / kotlin.math.sqrt(dx * dx + dy * dy)
    }
}
