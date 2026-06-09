package com.example.Task_Management_System.controller;

import com.example.Task_Management_System.entity.Task;
import com.example.Task_Management_System.repository.TaskRepository;
import com.example.Task_Management_System.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

    @GetMapping
    public List<Task> getAllTasks() {
        UserDetailsImpl currentUser = getCurrentUser();
        if ("ADMIN".equals(currentUser.getRole())) {
            return taskRepository.findAll();
        }
        return taskRepository.findByAssignedUserEmail(currentUser.getUsername());
    }

    private UserDetailsImpl getCurrentUser() {
        return (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    private boolean isAdmin() {
        return "ADMIN".equals(getCurrentUser().getRole());
    }

    private boolean isAssignedToCurrentUser(Task task) {
        UserDetailsImpl currentUser = getCurrentUser();
        return task.getAssignedUser() != null && task.getAssignedUser().getId().equals(currentUser.getId());
    }

    @PostMapping
    public Task createTask(@RequestBody Task task) {
        return taskRepository.save(task);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(@PathVariable Long id, @RequestBody Task taskDetails) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (!isAdmin()) {
            if (!isAssignedToCurrentUser(task)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            task.setStatus(taskDetails.getStatus());
            return ResponseEntity.ok(taskRepository.save(task));
        }

        task.setTitle(taskDetails.getTitle());
        task.setDescription(taskDetails.getDescription());
        task.setDeadline(taskDetails.getDeadline());
        task.setStatus(taskDetails.getStatus());
        task.setPriority(taskDetails.getPriority());
        task.setProject(taskDetails.getProject());
        task.setAssignedUser(taskDetails.getAssignedUser());
        
        return ResponseEntity.ok(taskRepository.save(task));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        taskRepository.delete(task);
        return ResponseEntity.ok().build();
    }
}
