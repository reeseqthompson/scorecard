package com.example.roomscan

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.roomscan.export.JsonExporter
import com.example.roomscan.export.SvgExporter
import com.example.roomscan.geometry.FloorPlanBuilder
import com.example.roomscan.geometry.Opening
import com.example.roomscan.geometry.Vec2
import com.google.android.material.button.MaterialButton
import com.google.ar.core.Frame
import com.google.ar.core.Plane
import com.google.ar.core.TrackingState
import com.google.ar.sceneform.ux.ArFragment

class MainActivity : AppCompatActivity() {

    private lateinit var arFragment: ArFragment
    private val builder = FloorPlanBuilder()
    private var placing: Opening.Kind? = null
    private var scanningFinished = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        arFragment = supportFragmentManager.findFragmentById(R.id.arFragment) as ArFragment

        findViewById<MaterialButton>(R.id.doorButton).setOnClickListener {
            placing = if (placing == Opening.Kind.DOOR) null else Opening.Kind.DOOR
            toast("Door placement: ${placing == Opening.Kind.DOOR}")
        }
        findViewById<MaterialButton>(R.id.windowButton).setOnClickListener {
            placing = if (placing == Opening.Kind.WINDOW) null else Opening.Kind.WINDOW
            toast("Window placement: ${placing == Opening.Kind.WINDOW}")
        }
        findViewById<MaterialButton>(R.id.finishButton).setOnClickListener {
            scanningFinished = true
            toast("Scanning finished. You can export now.")
        }
        findViewById<MaterialButton>(R.id.exportButton).setOnClickListener {
            val svg = SvgExporter.export(this, builder.getWalls(), builder.getDoors(), builder.getWindows())
            val json = JsonExporter.export(this, builder.getWalls(), builder.getDoors(), builder.getWindows())
            toast("Exported to: ${svg.name}, ${json.name}")
        }

        // Collect plane data continuously while scanning
        arFragment.arSceneView.scene.addOnUpdateListener {
            if (!scanningFinished) updateFromFrame()
        }

        // Tap to place openings
        arFragment.setOnTapArPlaneListener { hit, plane, _ ->
            val kind = placing ?: return@setOnTapArPlaneListener
            // Place only on vertical planes
            if (plane.type != Plane.Type.VERTICAL) {
                toast("Tap a wall to place ${kind.name.lowercase()}")
                return@setOnTapArPlaneListener
            }
            val p = hit.hitPose
            val x = p.tx().toDouble()
            val z = p.tz().toDouble()
            builder.addOpening(kind, Vec2(x, z))
            toast("${kind.name.lowercase().replaceFirstChar { it.uppercase() }} added")
        }
    }

    private fun updateFromFrame() {
        val frame: Frame = arFragment.arSceneView.arFrame ?: return
        val session = arFragment.arSceneView.session ?: return
        // Use all trackable planes so the model stabilizes across frames
        val planes = session.getAllTrackables(Plane::class.java)
        planes.filter { it.trackingState == TrackingState.TRACKING && it.type == Plane.Type.VERTICAL }
            .forEach { builder.updateWithPlane(it) }
    }

    private fun toast(msg: String) {
        Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
    }
}
