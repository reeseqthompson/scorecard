package com.example.roomscan.export

import android.content.Context
import com.example.roomscan.geometry.LineSegment
import com.example.roomscan.geometry.Opening
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

object JsonExporter {
    fun export(context: Context, walls: List<LineSegment>, doors: List<Opening>, windows: List<Opening>): File {
        val root = JSONObject()
        root.put("units", "meters")
        val wallsArr = JSONArray()
        walls.forEach {
            val o = JSONObject()
            o.put("x1", it.a.x)
            o.put("y1", it.a.y)
            o.put("x2", it.b.x)
            o.put("y2", it.b.y)
            wallsArr.put(o)
        }
        val doorsArr = JSONArray()
        doors.forEach {
            val o = JSONObject()
            o.put("kind", "door")
            o.put("x", it.center.x)
            o.put("y", it.center.y)
            o.put("width", it.widthMeters)
            doorsArr.put(o)
        }
        val windowsArr = JSONArray()
        windows.forEach {
            val o = JSONObject()
            o.put("kind", "window")
            o.put("x", it.center.x)
            o.put("y", it.center.y)
            o.put("width", it.widthMeters)
            windowsArr.put(o)
        }
        root.put("walls", wallsArr)
        root.put("doors", doorsArr)
        root.put("windows", windowsArr)

        val out = File(context.getExternalFilesDir(null), "floorplan.json")
        out.writeText(root.toString(2))
        return out
    }
}
