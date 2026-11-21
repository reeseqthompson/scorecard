package com.example.roomscan.export

import android.content.Context
import com.example.roomscan.geometry.LineSegment
import com.example.roomscan.geometry.Opening
import com.example.roomscan.geometry.Vec2
import java.io.File
import kotlin.math.max
import kotlin.math.min

object SvgExporter {
    private const val PX_PER_METER = 100.0
    private const val WALL_STROKE = 8.0

    data class Bounds(val minX: Double, val minY: Double, val maxX: Double, val maxY: Double)

    private fun computeBounds(walls: List<LineSegment>, opens: List<Opening>): Bounds {
        var minX = Double.POSITIVE_INFINITY
        var minY = Double.POSITIVE_INFINITY
        var maxX = Double.NEGATIVE_INFINITY
        var maxY = Double.NEGATIVE_INFINITY
        fun add(p: Vec2) {
            minX = min(minX, p.x); minY = min(minY, p.y)
            maxX = max(maxX, p.x); maxY = max(maxY, p.y)
        }
        walls.forEach { add(it.a); add(it.b) }
        opens.forEach { add(it.center) }
        if (!minX.isFinite()) { minX = 0.0; minY = 0.0; maxX = 1.0; maxY = 1.0 }
        return Bounds(minX, minY, maxX, maxY)
    }

    fun export(context: Context, walls: List<LineSegment>, doors: List<Opening>, windows: List<Opening>): File {
        val b = computeBounds(walls, doors + windows)
        val width = ((b.maxX - b.minX) * PX_PER_METER).coerceAtLeast(100.0)
        val height = ((b.maxY - b.minY) * PX_PER_METER).coerceAtLeast(100.0)
        val sb = StringBuilder()
        sb.append("""
            <svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'>
              <g transform='translate(${ -b.minX * PX_PER_METER }, ${ -b.minY * PX_PER_METER })'>
          """.trimIndent())

        // Walls
        walls.forEach {
            val x1 = it.a.x * PX_PER_METER
            val y1 = it.a.y * PX_PER_METER
            val x2 = it.b.x * PX_PER_METER
            val y2 = it.b.y * PX_PER_METER
            sb.append("<line x1='${x1}' y1='${y1}' x2='${x2}' y2='${y2}' stroke='black' stroke-width='${WALL_STROKE}' stroke-linecap='round' />\n")
        }

        // Doors (green) and windows (blue)
        fun openingToSvg(o: Opening, color: String) {
            val x = o.center.x * PX_PER_METER
            val y = o.center.y * PX_PER_METER
            val half = (o.widthMeters * PX_PER_METER) / 2.0
            sb.append("<line x1='${x - half}' y1='${y}' x2='${x + half}' y2='${y}' stroke='${color}' stroke-width='4' />\n")
        }
        doors.forEach { openingToSvg(it, "#2e7d32") }
        windows.forEach { openingToSvg(it, "#1565c0") }

        sb.append("</g></svg>")

        val out = File(context.getExternalFilesDir(null), "floorplan.svg")
        out.writeText(sb.toString())
        return out
    }
}
