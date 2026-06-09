package com.example.Task_Management_System.repository;

import com.example.Task_Management_System.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByAssignedUserEmail(String email);
}
